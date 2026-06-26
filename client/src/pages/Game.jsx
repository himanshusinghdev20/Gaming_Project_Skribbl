import { useState, useEffect, useRef, useCallback } from 'react';
import DrawingCanvas from '../components/DrawingCanvas';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';
import WordSelection from '../components/WordSelection';
import GameOver from '../components/GameOver';
import './Game.css';

export default function Game({ socket, roomId, currentPlayer, initialPlayers, settings, onHome }) {
  const [players, setPlayers] = useState(initialPlayers || []);
  const [phase, setPhase] = useState('waiting'); // waiting, word_selection, drawing, round_end, game_over
  const [drawerId, setDrawerId] = useState(null);
  const [wordOptions, setWordOptions] = useState([]);
  const [currentWord, setCurrentWord] = useState('');
  const [hint, setHint] = useState('');
  const [wordLength, setWordLength] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(settings?.rounds || 3);
  const [messages, setMessages] = useState([]);
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false);
  const [roundEndData, setRoundEndData] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [showingRoundEnd, setShowingRoundEnd] = useState(false);
  const [drawerName, setDrawerName] = useState('');

  const isDrawer = currentPlayer?.id === drawerId;
  const drawTime = settings?.drawTime || 80;

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev.slice(-100), msg]);
  }, []);

  // Assign stable colors to players
  const playerColors = useRef({});
  const COLORS = ['#6c63ff','#ff6584','#43e97b','#ffd166','#06d6a0','#ef476f','#118ab2','#ffa62b'];
  players.forEach((p, i) => {
    if (!playerColors.current[p.id]) {
      playerColors.current[p.id] = COLORS[Object.keys(playerColors.current).length % COLORS.length];
    }
  });

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      player_joined: ({ player, players }) => {
        setPlayers(players);
        addMessage({ type: 'system', text: `${player.name} joined the room` });
      },
      player_left: ({ playerName, players, newHostId }) => {
        setPlayers(players);
        addMessage({ type: 'system', text: `${playerName} left the room` });
      },
      game_started: ({ round, totalRounds, players }) => {
        setRound(round);
        setTotalRounds(totalRounds);
        setPlayers(players);
        setPhase('waiting');
        setMessages([]);
        addMessage({ type: 'system', text: '🎮 Game started!' });
      },
      word_options: ({ words }) => {
        setWordOptions(words);
        setPhase('word_selection');
      },
      word_chosen_confirm: ({ word }) => {
        setCurrentWord(word);
      },
      round_start: ({ drawerId, drawerName, round, totalRounds, wordLength }) => {
        setDrawerId(drawerId);
        setDrawerName(drawerName);
        setRound(round);
        setTotalRounds(totalRounds);
        setHasGuessedCorrectly(false);
        setCurrentWord('');
        setHint('');
        addMessage({ type: 'system', text: `Round ${round}/${totalRounds} - ${drawerName} is choosing a word...` });
      },
      round_drawing: ({ drawerId, drawerName, wordLength, hint, round, totalRounds, drawTime }) => {
        setDrawerId(drawerId);
        setDrawerName(drawerName);
        setPhase('drawing');
        setWordLength(wordLength);
        setHint(hint || '');
        setTimeLeft(drawTime);
        setRound(round);
        setTotalRounds(totalRounds);
        setShowingRoundEnd(false);
        setRoundEndData(null);
        // Sync canvas for late draws
        socket.emit('canvas_sync_request');
        addMessage({ type: 'system', text: `✏️ ${drawerName} is drawing!` });
      },
      timer_update: ({ timeLeft }) => {
        setTimeLeft(timeLeft);
      },
      hint_update: ({ hint }) => {
        setHint(hint);
      },
      draw_data: (stroke) => {
        if (window._canvasAPI) {
          window._canvasAPI.applyRemoteStroke(stroke);
        }
      },
      canvas_cleared: () => {
        if (window._canvasAPI) window._canvasAPI.clearCanvas();
      },
      canvas_undo: ({ strokes }) => {
        if (window._canvasAPI) window._canvasAPI.replayStrokes(strokes);
      },
      canvas_sync: ({ strokes }) => {
        if (window._canvasAPI) window._canvasAPI.replayStrokes(strokes);
      },
      guess_result: ({ correct, playerId, playerName, points, players }) => {
        setPlayers(players);
        if (correct) {
          if (playerId === currentPlayer?.id) {
            setHasGuessedCorrectly(true);
          }
          addMessage({ type: 'correct', playerName, points, playerId });
        }
      },
      chat_message: (msg) => {
        const color = playerColors.current[msg.playerId] || '#8899aa';
        addMessage({ ...msg, color });
      },
      round_end: ({ word, scores, nextDrawerId }) => {
        setPhase('round_end');
        setShowingRoundEnd(true);
        setRoundEndData({ word, scores });
        setPlayers(scores);
        setCurrentWord(word);
        if (window._canvasAPI) window._canvasAPI.clearCanvas();
        addMessage({ type: 'system', text: `⏰ Round ended! The word was "${word}"` });
        setTimeout(() => {
          setShowingRoundEnd(false);
          setRoundEndData(null);
          setHasGuessedCorrectly(false);
        }, 4000);
      },
      game_over: ({ winner, leaderboard }) => {
        setPhase('game_over');
        setGameOverData({ winner, leaderboard });
      },
      error: ({ message }) => {
        addMessage({ type: 'system', text: `❌ ${message}` });
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, currentPlayer?.id]);

  const handleWordChosen = (word) => {
    socket.emit('word_chosen', { word });
    setCurrentWord(word);
    setPhase('drawing');
  };

  const handleGuess = (text) => {
    socket.emit('guess', { text });
  };

  const handleChat = (text) => {
    socket.emit('chat', { text });
  };

  const renderWordDisplay = () => {
    if (isDrawer && currentWord) {
      return (
        <div className="word-display drawer-word">
          <span className="word-label">Your word:</span>
          <span className="the-word">{currentWord}</span>
        </div>
      );
    }
    if (hint) {
      return (
        <div className="word-display hint-display">
          <span className="word-label">Guess:</span>
          <span className="hint-chars">{hint}</span>
          <span className="word-length">({wordLength} letters)</span>
        </div>
      );
    }
    if (wordLength > 0) {
      return (
        <div className="word-display hint-display">
          <span className="word-label">Guess:</span>
          <span className="hint-chars">{Array(wordLength).fill('_').join(' ')}</span>
          <span className="word-length">({wordLength} letters)</span>
        </div>
      );
    }
    return null;
  };

  if (gameOverData) {
    return (
      <GameOver
        winner={gameOverData.winner}
        leaderboard={gameOverData.leaderboard}
        onPlayAgain={() => {
          setGameOverData(null);
          setPhase('waiting');
          setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
        }}
        onHome={onHome}
      />
    );
  }

  return (
    <div className="game-page">
      {/* Top Bar */}
      <div className="game-topbar">
        <div className="topbar-left">
          <span className="logo-sm">🎨</span>
          <span className="game-room-id">#{roomId}</span>
        </div>
        <div className="topbar-center">
          <div className="round-badge">Round {round}/{totalRounds}</div>
          {phase === 'drawing' && (
            <div className={`timer-display ${timeLeft <= 10 ? 'urgent' : ''}`}>
              ⏱️ {timeLeft}s
            </div>
          )}
          {renderWordDisplay()}
        </div>
        <div className="topbar-right">
          <button className="btn btn-sm btn-outline" onClick={onHome}>🏠 Leave</button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="game-body">
        {/* Left: Players */}
        <div className="game-sidebar-left">
          <PlayerList
            players={players}
            currentPlayerId={currentPlayer?.id}
            drawerId={drawerId}
          />
        </div>

        {/* Center: Canvas */}
        <div className="game-center">
          <div className="canvas-container">
            {phase === 'word_selection' && isDrawer && (
              <WordSelection
                words={wordOptions}
                onChoose={handleWordChosen}
              />
            )}
            {phase === 'word_selection' && !isDrawer && (
              <div className="waiting-overlay">
                <div className="waiting-inner">
                  <div className="waiting-spinner"></div>
                  <p><strong>{drawerName}</strong> is choosing a word...</p>
                </div>
              </div>
            )}
            {showingRoundEnd && roundEndData && (
              <div className="round-end-overlay">
                <div className="round-end-inner card">
                  <div className="re-icon">⏰</div>
                  <h2>Round Over!</h2>
                  <p>The word was:</p>
                  <div className="re-word">{roundEndData.word}</div>
                </div>
              </div>
            )}
            <DrawingCanvas
              isDrawer={isDrawer && phase === 'drawing'}
              emit={(event, data) => socket.emit(event, data)}
            />
          </div>
        </div>

        {/* Right: Chat */}
        <div className="game-sidebar-right">
          <Chat
            messages={messages}
            onGuess={handleGuess}
            onChat={handleChat}
            isDrawer={isDrawer}
            hasGuessedCorrectly={hasGuessedCorrectly}
            currentWord={currentWord}
          />
        </div>
      </div>
    </div>
  );
}
