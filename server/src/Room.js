const { v4: uuidv4 } = require('uuid');
const Player = require('./Player');
const Game = require('./Game');

class Room {
  constructor(settings, io) {
    this.id = uuidv4().slice(0, 6).toUpperCase();
    this.io = io;
    this.players = new Map(); // id -> Player
    this.game = null;
    this.settings = {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints || 2,
      isPrivate: settings.isPrivate || false,
    };
    this.hostId = null;
    this.roundTimer = null;
    this.hintInterval = null;
    this.chatMessages = [];
  }

  addPlayer(socketId, name) {
    const id = socketId;
    const player = new Player(id, name, socketId);
    if (this.players.size === 0) {
      player.isHost = true;
      this.hostId = id;
    }
    this.players.set(id, player);
    return player;
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;

    this.players.delete(socketId);

    // If host left, assign new host
    if (socketId === this.hostId && this.players.size > 0) {
      const newHost = this.players.values().next().value;
      newHost.isHost = true;
      this.hostId = newHost.id;
    }

    return player;
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getPlayersList() {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  isEmpty() {
    return this.players.size === 0;
  }

  isFull() {
    return this.players.size >= this.settings.maxPlayers;
  }

  broadcast(event, data, excludeSocketId = null) {
    if (excludeSocketId) {
      this.io.to(this.id).except(excludeSocketId).emit(event, data);
    } else {
      this.io.to(this.id).emit(event, data);
    }
  }

  emitToPlayer(socketId, event, data) {
    this.io.to(socketId).emit(event, data);
  }

  startGame() {
    this.game = new Game(this.settings);
    // Reset all scores
    this.players.forEach(p => { p.score = 0; });
    const wordOptions = this.game.startGame(this.players);
    return wordOptions;
  }

  startRoundTimer(onRoundEnd) {
    this.clearTimers();
    let timeLeft = this.settings.drawTime;
    this.game.timeLeft = timeLeft;

    // Hint scheduling
    if (this.settings.hints > 0 && this.game.currentWord) {
      const hintInterval = Math.floor(this.settings.drawTime / (this.settings.hints + 1));
      let hintsGiven = 0;
      this.hintInterval = setInterval(() => {
        if (hintsGiven < this.settings.hints) {
          const hint = this.game.getHint();
          hintsGiven++;
          this.broadcast('hint_update', { hint });
        }
      }, hintInterval * 1000);
    }

    this.roundTimer = setInterval(() => {
      timeLeft--;
      this.game.timeLeft = timeLeft;
      this.broadcast('timer_update', { timeLeft });

      if (timeLeft <= 0) {
        this.clearTimers();
        onRoundEnd();
      }
    }, 1000);
  }

  clearTimers() {
    if (this.roundTimer) {
      clearInterval(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.hintInterval) {
      clearInterval(this.hintInterval);
      this.hintInterval = null;
    }
  }

  endRound() {
    this.clearTimers();
    const word = this.game.currentWord;
    const scores = this.getPlayersList();
    const wordOptions = this.game.nextTurn(this.players);

    // Reset player round state
    this.players.forEach(p => p.resetRound());

    return { word, scores, wordOptions };
  }

  addChatMessage(playerId, text, isGuess = false) {
    const player = this.players.get(playerId);
    if (!player) return null;
    const msg = {
      playerId,
      playerName: player.name,
      text,
      isGuess,
      timestamp: Date.now()
    };
    this.chatMessages.push(msg);
    return msg;
  }

  toJSON() {
    return {
      id: this.id,
      playerCount: this.players.size,
      maxPlayers: this.settings.maxPlayers,
      settings: this.settings,
      isPrivate: this.settings.isPrivate,
      inProgress: this.game !== null && this.game.phase !== 'waiting'
    };
  }
}

module.exports = Room;
