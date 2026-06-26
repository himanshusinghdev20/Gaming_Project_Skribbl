import { useState, useEffect } from 'react';
import { getSocket } from './hooks/useSocket';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import PublicRooms from './components/PublicRooms';

export default function App() {
  const [screen, setScreen] = useState('home'); // home, lobby, game, browse
  const [socket] = useState(() => getSocket());
  const [roomId, setRoomId] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [settings, setSettings] = useState({});
  const [playerName, setPlayerName] = useState('');
  const [connected, setConnected] = useState(false);

  // Check URL for room code on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      // Pre-fill room code logic could go here
    }
  }, []);

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    if (socket.connected) setConnected(true);

    socket.on('room_created', ({ roomId, player, players, settings }) => {
      setRoomId(roomId);
      setCurrentPlayer(player);
      setPlayers(players);
      setSettings(settings);
      setScreen('lobby');
      // Update URL
      window.history.pushState({}, '', `?room=${roomId}`);
    });

    socket.on('room_joined', ({ roomId, player, players, settings }) => {
      setRoomId(roomId);
      setCurrentPlayer(player);
      setPlayers(players);
      setSettings(settings);
      setScreen('lobby');
      window.history.pushState({}, '', `?room=${roomId}`);
    });

    socket.on('player_joined', ({ players }) => {
      setPlayers(players);
    });

    socket.on('player_left', ({ players }) => {
      setPlayers(players);
    });

    socket.on('game_started', ({ players }) => {
      setPlayers(players);
      setScreen('game');
    });

    socket.on('error', ({ message }) => {
      alert('❌ ' + message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('game_started');
      socket.off('error');
    };
  }, [socket]);

  const handleCreateRoom = (name, roomSettings) => {
    setPlayerName(name);
    socket.emit('create_room', { playerName: name, settings: roomSettings });
  };

  const handleJoinRoom = (name, code) => {
    setPlayerName(name);
    socket.emit('join_room', { roomId: code, playerName: name });
  };

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  const handleGoHome = () => {
    setScreen('home');
    setRoomId('');
    setCurrentPlayer(null);
    setPlayers([]);
    window.history.pushState({}, '', '/');
  };

  if (!connected && screen !== 'home') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div className="waiting-spinner" style={{ width: 50, height: 50, border: '4px solid #2d4070', borderTopColor: '#6c63ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: '#8899aa' }}>Connecting to server...</p>
      </div>
    );
  }

  if (screen === 'browse') {
    return (
      <PublicRooms
        socket={socket}
        playerName={playerName}
        onJoin={(name, code) => { handleJoinRoom(name, code); }}
        onBack={() => setScreen('home')}
      />
    );
  }

  if (screen === 'lobby') {
    return (
      <Lobby
        roomId={roomId}
        players={players}
        currentPlayer={currentPlayer}
        settings={settings}
        onStartGame={handleStartGame}
      />
    );
  }

  if (screen === 'game') {
    return (
      <Game
        socket={socket}
        roomId={roomId}
        currentPlayer={currentPlayer}
        initialPlayers={players}
        settings={settings}
        onHome={handleGoHome}
      />
    );
  }

  return (
    <Home
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onBrowseRooms={(name) => {
        setPlayerName(name);
        setScreen('browse');
      }}
    />
  );
}
