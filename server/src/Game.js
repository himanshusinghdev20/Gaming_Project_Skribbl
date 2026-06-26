const { getRandomWords } = require('./words');

class Game {
  constructor(settings) {
    this.settings = settings;
    this.currentRound = 0;
    this.totalRounds = settings.rounds || 3;
    this.drawTime = settings.drawTime || 80;
    this.wordCount = settings.wordCount || 3;
    this.maxHints = settings.hints || 2;
    this.currentDrawerIndex = 0;
    this.currentWord = null;
    this.wordOptions = [];
    this.phase = 'waiting'; // waiting, word_selection, drawing, round_end, game_over
    this.timer = null;
    this.hintTimer = null;
    this.timeLeft = 0;
    this.revealedIndices = new Set();
    this.hintsGiven = 0;
    this.currentHint = '';
    this.playerOrder = [];
    this.drawHistory = []; // For undo
    this.canvasStrokes = []; // For late joiners
  }

  startGame(players) {
    this.playerOrder = [...players.keys()];
    this.currentRound = 1;
    this.currentDrawerIndex = 0;
    this.phase = 'word_selection';
    this.wordOptions = getRandomWords(this.wordCount);
    return this.wordOptions;
  }

  getCurrentDrawerId() {
    return this.playerOrder[this.currentDrawerIndex];
  }

  selectWord(word) {
    this.currentWord = word.toLowerCase().trim();
    this.phase = 'drawing';
    this.timeLeft = this.drawTime;
    this.revealedIndices = new Set();
    this.hintsGiven = 0;
    this.drawHistory = [];
    this.canvasStrokes = [];
    this.currentHint = this.getBlankWord();
  }

  getBlankWord() {
    if (!this.currentWord) return '';
    return this.currentWord
      .split('')
      .map((char) => (char === ' ' ? ' ' : '_'))
      .join(' ');
  }

  getHint() {
    if (!this.currentWord) return this.currentHint;
    const hiddenIndices = [];
    for (let i = 0; i < this.currentWord.length; i++) {
      if (this.currentWord[i] !== ' ' && !this.revealedIndices.has(i)) {
        hiddenIndices.push(i);
      }
    }
    if (hiddenIndices.length === 0) return this.currentHint;

    // Reveal one random hidden letter
    const randIdx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    this.revealedIndices.add(randIdx);
    this.hintsGiven++;

    this.currentHint = this.currentWord
      .split('')
      .map((char, i) => {
        if (char === ' ') return ' ';
        if (this.revealedIndices.has(i)) return char;
        return '_';
      })
      .join(' ');

    return this.currentHint;
  }

  checkGuess(guess) {
    if (!this.currentWord) return false;
    return guess.toLowerCase().trim() === this.currentWord;
  }

  calculatePoints(timeLeft, totalTime, isFirstGuess) {
    const timeRatio = timeLeft / totalTime;
    const basePoints = Math.round(100 + timeRatio * 150);
    return isFirstGuess ? basePoints + 50 : basePoints;
  }

  addStroke(stroke) {
    this.canvasStrokes.push(stroke);
    return this.canvasStrokes;
  }

  undoLastStroke() {
    // Remove strokes from last draw_start
    let i = this.canvasStrokes.length - 1;
    while (i >= 0 && this.canvasStrokes[i].type !== 'start') {
      i--;
    }
    if (i >= 0) {
      this.canvasStrokes.splice(i);
    }
    return this.canvasStrokes;
  }

  clearCanvas() {
    this.canvasStrokes = [];
  }

  nextTurn(players) {
    this.currentDrawerIndex = (this.currentDrawerIndex + 1) % this.playerOrder.length;

    // If we've gone through all players, increment round
    if (this.currentDrawerIndex === 0) {
      this.currentRound++;
    }

    if (this.currentRound > this.totalRounds) {
      this.phase = 'game_over';
      return null;
    }

    this.phase = 'word_selection';
    this.wordOptions = getRandomWords(this.wordCount);
    this.currentWord = null;
    this.currentHint = '';

    return this.wordOptions;
  }

  getState(playerId = null, players = null) {
    const isDrawer = playerId === this.getCurrentDrawerId();
    return {
      phase: this.phase,
      round: this.currentRound,
      totalRounds: this.totalRounds,
      drawerId: this.getCurrentDrawerId(),
      word: isDrawer && this.phase === 'drawing' ? this.currentWord : null,
      hint: this.currentHint,
      wordLength: this.currentWord ? this.currentWord.length : 0,
      timeLeft: this.timeLeft,
      drawTime: this.drawTime
    };
  }
}

module.exports = Game;
