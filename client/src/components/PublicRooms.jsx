import { useState, useEffect } from 'react';
import './PublicRooms.css';

export default function PublicRooms({ socket, playerName, onJoin, onBack }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = () => {
    setLoading(true);
    socket.emit('get_public_rooms');
  };

  useEffect(() => {
    socket.on('public_rooms', ({ rooms }) => {
      setRooms(rooms);
      setLoading(false);
    });
    fetchRooms();
    return () => socket.off('public_rooms');
  }, []);

  return (
    <div className="public-rooms-page">
      <div className="pr-container">
        <div className="pr-header">
          <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
          <h2>🌐 Public Rooms</h2>
          <button className="btn btn-sm btn-primary" onClick={fetchRooms}>🔄 Refresh</button>
        </div>

        {loading ? (
          <div className="pr-loading">
            <div className="waiting-spinner"></div>
            <p>Searching for rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="pr-empty card">
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏜️</div>
            <h3>No public rooms found</h3>
            <p>Be the first to create one!</p>
          </div>
        ) : (
          <div className="pr-list">
            {rooms.map(room => (
              <div key={room.id} className="pr-item card fade-in">
                <div className="pr-info">
                  <div className="pr-code">#{room.id}</div>
                  <div className="pr-meta">
                    <span>👥 {room.playerCount}/{room.maxPlayers}</span>
                    <span>🔄 {room.settings?.rounds} rounds</span>
                    <span>⏱️ {room.settings?.drawTime}s</span>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onJoin(playerName, room.id)}
                >
                  Join →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
