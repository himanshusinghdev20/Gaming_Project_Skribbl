import './GameOver.css';

const AVATARS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐙', '🦋', '🦄', '🐲', '🦅', '🐬'];

const MEDALS = ['🥇', '🥈', '🥉'];

export default function GameOver({ winner, leaderboard, onPlayAgain, onHome }) {
  return (
    <div className="gameover-page">
      <div className="go-container card">
        <div className="go-confetti">🎊🎉🎊🎉🎊</div>
        <h1 className="go-title">Game Over!</h1>

        {winner && (
          <div className="go-winner">
            <div className="winner-crown">👑</div>
            <div className="winner-avatar">{AVATARS[(winner.avatar || 1) - 1]}</div>
            <div className="winner-name">{winner.name}</div>
            <div className="winner-score">{winner.score} points</div>
            <div className="winner-label">🏆 Winner!</div>
          </div>
        )}

        <div className="leaderboard">
          <h2 className="lb-title">Leaderboard</h2>
          <div className="lb-list">
            {leaderboard.map((p, i) => (
              <div key={p.id} className={`lb-item rank-${i + 1} fade-in`} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lb-rank">{MEDALS[i] || `#${i + 1}`}</div>
                <div className="lb-avatar">{AVATARS[(p.avatar || 1) - 1]}</div>
                <div className="lb-name">{p.name}</div>
                <div className="lb-score">{p.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        <div className="go-actions">
          <button className="btn btn-primary btn-lg" onClick={onPlayAgain}>
            🔄 Play Again
          </button>
          <button className="btn btn-outline btn-lg" onClick={onHome}>
            🏠 Home
          </button>
        </div>
      </div>
    </div>
  );
}
