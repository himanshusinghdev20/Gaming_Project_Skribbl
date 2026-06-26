import { useState, useEffect, useRef } from 'react';
import './Chat.css';

export default function Chat({ messages, onGuess, onChat, isDrawer, hasGuessedCorrectly, currentWord }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (!isDrawer && !hasGuessedCorrectly) {
      onGuess(text);
    } else {
      onChat(text);
    }
    setInput('');
  };

  const getPlaceholder = () => {
    if (isDrawer) return 'You are drawing...';
    if (hasGuessedCorrectly) return `You guessed it! Chat freely...`;
    return 'Type your guess here...';
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <span>💬 Chat & Guesses</span>
      </div>
      <div className="messages-list">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.type || ''} fade-in`}>
            {msg.type === 'correct' ? (
              <div className="correct-guess-msg">
                <span>🎉</span>
                <span><strong>{msg.playerName}</strong> guessed the word! <span className="points">+{msg.points}</span></span>
              </div>
            ) : msg.type === 'system' ? (
              <div className="system-msg">{msg.text}</div>
            ) : (
              <div className="chat-msg">
                <span className="chat-name" style={{ color: msg.color || '#8899aa' }}>{msg.playerName}:</span>
                <span className="chat-text">{msg.text}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="input chat-input"
          type="text"
          placeholder={getPlaceholder()}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={isDrawer && !hasGuessedCorrectly}
          maxLength={60}
        />
        <button className="btn btn-primary btn-sm send-btn" onClick={handleSend}>
          ➤
        </button>
      </div>
    </div>
  );
}
