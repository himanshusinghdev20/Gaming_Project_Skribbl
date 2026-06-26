import { useState, useEffect } from 'react';
import './WordSelection.css';

export default function WordSelection({ words, onChoose, timeLeft = 15 }) {
  const [timer, setTimer] = useState(timeLeft);

  useEffect(() => {
    if (timer <= 0) {
      onChoose(words[0]);
      return;
    }
    const t = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  return (
    <div className="word-select-overlay">
      <div className="word-select-card card">
        <div className="ws-timer">{timer}s</div>
        <h2 className="ws-title">Choose a word to draw!</h2>
        <p className="ws-subtitle">Pick one of the words below</p>
        <div className="ws-words">
          {words.map((word, i) => (
            <button
              key={i}
              className="ws-word-btn btn"
              onClick={() => onChoose(word)}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
