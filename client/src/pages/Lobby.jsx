import { useState } from 'react';
import './Lobby.css';

const AVATARS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🦋', '🦄', '🐲', '🦅', '🐬'];

export default function Lobby({ roomId, players, currentPlayer, settings, onStartGame }) {
  const [copied, setCopied] = useState(false);
  const isHost = currentPlayer?.isHost;

  const copyCode = () => {
    navigator.clipboard.writeText(roomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const url = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <div className="lobby-title">
          <span className="logo-small">🎨</span>
          <h1>Skribbl Clone</h1>
        </div>
        <div className="room-info">
          <div className="room-code-box">
            <span className="room-label">Room Code:</span>
            <span className="room-code">{roomId}</span>
            <button className="btn btn-sm btn-outline" onClick={copyCode}>
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button className="btn btn-sm btn-outline" onClick={copyLink}>
              🔗 Share
            </button>
          </div>
        </div>
      </div>

      <div className="lobby-body">
        <div className="lobby-left card">
          <h2 className="section-title">
            Players ({players.length}/{settings.maxPlayers})
          </h2>
          <div className="players-list">
            {players.map((p) => (
              <div key={p.id} className={`player-item ${p.id === currentPlayer?.id ? 'me' : ''}`}>
                <div className="player-avatar">
                  {AVATARS[(p.avatar || 1) - 1] || '😀'}
                </div>
                <div className="player-info">
                  <span className="player-name">{p.name}</span>
                  {p.isHost && <span className="host-badge">👑 Host</span>}
                  {p.id === currentPlayer?.id && <span className="you-badge">You</span>}
                </div>
                <div className="player-score">{p.score} pts</div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="player-item empty">
                <div className="player-avatar">👤</div>
                <span className="player-name dim">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lobby-right card">
          <h2 className="section-title">⚙️ Game Settings</h2>
          <div className="settings-display">
            <div className="setting-row">
              <span>👥 Max Players</span>
              <span className="setting-val">{settings.maxPlayers}</span>
            </div>
            <div className="setting-row">
              <span>🔄 Rounds</span>
              <span className="setting-val">{settings.rounds}</span>
            </div>
            <div className="setting-row">
              <span>⏱️ Draw Time</span>
              <span className="setting-val">{settings.drawTime}s</span>
            </div>
            <div className="setting-row">
              <span>📝 Word Choices</span>
              <span className="setting-val">{settings.wordCount}</span>
            </div>
            <div className="setting-row">
              <span>💡 Hints</span>
              <span className="setting-val">{settings.hints === 0 ? 'Off' : settings.hints}</span>
            </div>
            <div className="setting-row">
              <span>🔒 Private</span>
              <span className="setting-val">{settings.isPrivate ? 'Yes' : 'No'}</span>
            </div>
          </div>

          <div className="lobby-actions">
            {isHost ? (
              <>
                {players.length < 2 ? (
                  <p className="waiting-msg">⏳ Waiting for at least 2 players...</p>
                ) : null}
                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={onStartGame}
                  disabled={players.length < 2}
                >
                  🚀 Start Game
                </button>
              </>
            ) : (
              <div className="waiting-host">
                <div className="waiting-spinner"></div>
                <p>Waiting for host to start...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
