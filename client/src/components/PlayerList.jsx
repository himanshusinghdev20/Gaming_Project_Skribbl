import './PlayerList.css';

const AVATARS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🦋', '🦄', '🐲', '🦅', '🐬'];

const PLAYER_COLORS = [
  '#6c63ff', '#ff6584', '#43e97b', '#ffd166',
  '#06d6a0', '#ef476f', '#118ab2', '#ffa62b'
];

export default function PlayerList({ players, currentPlayerId, drawerId }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="player-list-panel">
      <div className="pl-header">👥 Players</div>
      <div className="pl-list">
        {sorted.map((p, idx) => {
          const isMe = p.id === currentPlayerId;
          const isDrawing = p.id === drawerId;
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];

          return (
            <div
              key={p.id}
              className={`pl-item ${isMe ? 'me' : ''} ${p.hasGuessedCorrectly ? 'guessed' : ''} fade-in`}
            >
              <div className="pl-rank">#{idx + 1}</div>
              <div className="pl-avatar" style={{ fontSize: '20px' }}>
                {AVATARS[(p.avatar || 1) - 1] || '😀'}
              </div>
              <div className="pl-info">
                <div className="pl-name" style={{ color: isMe ? color : undefined }}>
                  {p.name}
                  {p.isHost && <span className="badge host">👑</span>}
                  {isMe && <span className="badge you">You</span>}
                </div>
                <div className="pl-status">
                  {isDrawing ? <span className="drawing-badge">✏️ Drawing</span>
                    : p.hasGuessedCorrectly ? <span className="correct-badge">✓ Guessed!</span>
                    : null}
                </div>
              </div>
              <div className="pl-score" style={{ color }}>
                {p.score}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
