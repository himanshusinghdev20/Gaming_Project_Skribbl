import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || '';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
  }
  return socketInstance;
}

export function useSocket(events = {}) {
  const socket = getSocket();
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    const handlers = {};
    Object.entries(eventsRef.current).forEach(([event, handler]) => {
      const wrapped = (...args) => handler(...args);
      handlers[event] = wrapped;
      socket.on(event, wrapped);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, []);

  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, []);

  return { socket, emit };
}
