import { useState } from 'react';
import './Home.css';

export default function Home({ onCreateRoom, onJoinRoom, onBrowseRooms }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [tab, setTab] = useState('home'); // home, join, create
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTime: 80,
    wordCount: 3,
    hints: 2,
    isPrivate: false
  });

  const handleCreate = () => {
    if (!name.trim()) { alert('Please enter your name!'); return; }
    onCreateRoom(name.trim(), settings);
  };

  const handleJoin = () => {
    if (!name.trim()) { alert('Please enter your name!'); return; }
    if (!roomCode.trim()) { alert('Please enter a room code!'); return; }
    onJoinRoom(name.trim(), roomCode.trim().toUpperCase());
  };

  return (
    <div className="home-page">
      <div className="home-bg">
        <div className="bubble b1"></div>
        <div className="bubble b2"></div>
        <div className="bubble b3"></div>
      </div>

      <div className="home-container">
        <div className="home-header">
          <div className="logo">🎨</div>
          <h1 className="home-title">Skribbl Clone</h1>
          <p className="home-subtitle">Draw, Guess & Win with Friends!</p>
        </div>

        <div className="home-card card">
          <div className="tab-bar">
            <button className={`tab-btn ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
              🏠 Play
            </button>
            <button className={`tab-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
              ➕ Create
            </button>
          </div>

          <div className="name-section">
            <label className="field-label">Your Name</label>
            <input
              className="input"
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && tab === 'home' && handleJoin()}
            />
          </div>

          {tab === 'home' && (
            <div className="play-section fade-in">
              <div className="join-row">
                <input
                  className="input"
                  type="text"
                  placeholder="Room code (e.g. AB12CD)"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button className="btn btn-primary" onClick={handleJoin}>Join</button>
              </div>
              <div className="divider"><span>or</span></div>
              <button className="btn btn-outline w-full" onClick={handleCreate}>
                🎮 Create New Room
              </button>
              <button className="btn btn-secondary w-full mt-8" onClick={() => { if (!name.trim()) { alert('Enter your name first!'); return; } onBrowseRooms(name.trim()); }}>
                🌐 Browse Public Rooms
              </button>
            </div>
          )}

          {tab === 'create' && (
            <div className="create-section fade-in">
              <div className="settings-grid">
                <div className="setting-item">
                  <label>Max Players: <strong>{settings.maxPlayers}</strong></label>
                  <input type="range" min="2" max="20" value={settings.maxPlayers}
                    onChange={e => setSettings(s => ({ ...s, maxPlayers: +e.target.value }))} />
                </div>
                <div className="setting-item">
                  <label>Rounds: <strong>{settings.rounds}</strong></label>
                  <input type="range" min="1" max="10" value={settings.rounds}
                    onChange={e => setSettings(s => ({ ...s, rounds: +e.target.value }))} />
                </div>
                <div className="setting-item">
                  <label>Draw Time: <strong>{settings.drawTime}s</strong></label>
                  <input type="range" min="15" max="240" step="5" value={settings.drawTime}
                    onChange={e => setSettings(s => ({ ...s, drawTime: +e.target.value }))} />
                </div>
                <div className="setting-item">
                  <label>Word Choices: <strong>{settings.wordCount}</strong></label>
                  <input type="range" min="1" max="5" value={settings.wordCount}
                    onChange={e => setSettings(s => ({ ...s, wordCount: +e.target.value }))} />
                </div>
                <div className="setting-item">
                  <label>Hints: <strong>{settings.hints === 0 ? 'Off' : settings.hints}</strong></label>
                  <input type="range" min="0" max="5" value={settings.hints}
                    onChange={e => setSettings(s => ({ ...s, hints: +e.target.value }))} />
                </div>
                <div className="setting-item checkbox-item">
                  <label>
                    <input type="checkbox" checked={settings.isPrivate}
                      onChange={e => setSettings(s => ({ ...s, isPrivate: e.target.checked }))} />
                    <span>🔒 Private Room</span>
                  </label>
                </div>
              </div>
              <button className="btn btn-primary btn-lg w-full mt-16" onClick={handleCreate}>
                🚀 Create Room
              </button>
            </div>
          )}
        </div>

        <p className="home-footer">
          Draw • Guess • Win 🏆
        </p>
      </div>
    </div>
  );
}
