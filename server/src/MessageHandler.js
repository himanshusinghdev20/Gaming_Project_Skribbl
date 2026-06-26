class MessageHandler {
  constructor(io, rooms) {
    this.io = io;
    this.rooms = rooms; // Map of roomId -> Room
  }

  handleCreateRoom(socket, { playerName, settings }) {
    const Room = require('./Room');
    const room = new Room(settings || {}, this.io);
    this.rooms.set(room.id, room);

    socket.join(room.id);
    const player = room.addPlayer(socket.id, playerName || 'Anonymous');
    socket.data.roomId = room.id;

    socket.emit('room_created', {
      roomId: room.id,
      player: player.toJSON(),
      players: room.getPlayersList(),
      settings: room.settings
    });

    console.log(`Room ${room.id} created by ${playerName}`);
  }

  handleJoinRoom(socket, { roomId, playerName }) {
    const room = this.rooms.get(roomId?.toUpperCase());
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    if (room.isFull()) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }
    if (room.game && room.game.phase !== 'waiting') {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    socket.join(room.id);
    const player = room.addPlayer(socket.id, playerName || 'Anonymous');
    socket.data.roomId = room.id;

    socket.emit('room_joined', {
      roomId: room.id,
      player: player.toJSON(),
      players: room.getPlayersList(),
      settings: room.settings
    });

    room.broadcast('player_joined', {
      player: player.toJSON(),
      players: room.getPlayersList()
    }, socket.id);

    console.log(`${playerName} joined room ${room.id}`);
  }

  handleStartGame(socket) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player || !player.isHost) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }
    if (room.players.size < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    const wordOptions = room.startGame();
    const drawerId = room.game.getCurrentDrawerId();

    room.broadcast('game_started', {
      round: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      players: room.getPlayersList()
    });

    this.startNewTurn(room, drawerId, wordOptions);
  }

  startNewTurn(room, drawerId, wordOptions) {
    // Send word options to drawer only
    room.emitToPlayer(drawerId, 'word_options', {
      words: wordOptions,
      drawTime: room.settings.drawTime
    });

    // Tell everyone else who is drawing
    room.broadcast('round_start', {
      drawerId,
      drawerName: room.getPlayer(drawerId)?.name,
      round: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      wordLength: 0 // will update when word chosen
    }, drawerId);

    // Set a timeout: if drawer doesn't pick in 15s, auto-pick
    room._wordPickTimeout = setTimeout(() => {
      if (room.game && room.game.phase === 'word_selection') {
        const autoWord = wordOptions[0];
        this.handleWordChosen(room.getPlayer(drawerId)?._socket || { id: drawerId }, { word: autoWord }, room);
      }
    }, 15000);
  }

  handleWordChosen(socket, { word }, roomOverride = null) {
    const room = roomOverride || this.rooms.get(socket.data?.roomId);
    if (!room || !room.game) return;

    const drawerId = room.game.getCurrentDrawerId();
    if (socket.id !== drawerId && !roomOverride) return;

    if (room._wordPickTimeout) {
      clearTimeout(room._wordPickTimeout);
    }

    room.game.selectWord(word);
    const hint = room.game.currentHint;
    const wordLen = room.game.currentWord.length;

    // Tell drawer the word
    room.emitToPlayer(drawerId, 'word_chosen_confirm', { word });

    // Tell others the blank hint
    room.broadcast('round_drawing', {
      drawerId,
      drawerName: room.getPlayer(drawerId)?.name,
      wordLength: wordLen,
      hint,
      round: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      drawTime: room.settings.drawTime
    }, drawerId);

    // Also emit to drawer for consistency
    room.emitToPlayer(drawerId, 'round_drawing', {
      drawerId,
      drawerName: room.getPlayer(drawerId)?.name,
      wordLength: wordLen,
      hint,
      round: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      drawTime: room.settings.drawTime
    });

    // Start round timer
    room.startRoundTimer(() => this.handleRoundEnd(room));
  }

  handleDrawStart(socket, data) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room || !room.game || room.game.phase !== 'drawing') return;
    if (socket.id !== room.game.getCurrentDrawerId()) return;

    const stroke = { type: 'start', ...data };
    room.game.addStroke(stroke);
    room.broadcast('draw_data', stroke, socket.id);
  }

  handleDrawMove(socket, data) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room || !room.game || room.game.phase !== 'drawing') return;
    if (socket.id !== room.game.getCurrentDrawerId()) return;

    const stroke = { type: 'move', ...data };
    room.game.addStroke(stroke);
    room.broadcast('draw_data', stroke, socket.id);
  }

  handleDrawEnd(socket) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room || !room.game || room.game.phase !== 'drawing') return;
    if (socket.id !== room.game.getCurrentDrawerId()) return;

    const stroke = { type: 'end' };
    room.game.addStroke(stroke);
    room.broadcast('draw_data', stroke, socket.id);
  }

  handleCanvasClear(socket) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room || !room.game) return;
    if (socket.id !== room.game.getCurrentDrawerId()) return;

    room.game.clearCanvas();
    room.broadcast('canvas_cleared', {});
  }

  handleUndo(socket) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room || !room.game) return;
    if (socket.id !== room.game.getCurrentDrawerId()) return;

    const strokes = room.game.undoLastStroke();
    room.broadcast('canvas_undo', { strokes });
  }

  handleGuess(socket, { text }) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room || !room.game) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    // Drawer can't guess
    if (socket.id === room.game.getCurrentDrawerId()) return;

    // Already guessed correctly
    if (player.hasGuessedCorrectly) return;

    const isCorrect = room.game.checkGuess(text);

    if (isCorrect) {
      player.hasGuessedCorrectly = true;

      // Calculate points
      const guessersWhoGotIt = Array.from(room.players.values()).filter(p => p.hasGuessedCorrectly).length;
      const isFirst = guessersWhoGotIt === 1;
      const points = room.game.calculatePoints(room.game.timeLeft, room.settings.drawTime, isFirst);
      player.addScore(points);

      // Drawer also gets points
      const drawer = room.getPlayer(room.game.getCurrentDrawerId());
      if (drawer) {
        drawer.addScore(Math.round(points * 0.5));
      }

      room.broadcast('guess_result', {
        correct: true,
        playerId: socket.id,
        playerName: player.name,
        points,
        players: room.getPlayersList()
      });

      // Check if all non-drawers guessed correctly
      const nonDrawers = Array.from(room.players.values()).filter(
        p => p.id !== room.game.getCurrentDrawerId()
      );
      const allGuessed = nonDrawers.every(p => p.hasGuessedCorrectly);

      if (allGuessed) {
        room.clearTimers();
        setTimeout(() => this.handleRoundEnd(room), 1500);
      }
    } else {
      // Broadcast as chat message
      const msg = room.addChatMessage(socket.id, text, true);
      room.broadcast('chat_message', { ...msg, isGuess: true });
    }
  }

  handleChat(socket, { text }) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    // If player already guessed correctly, don't broadcast guess as chat
    const msg = room.addChatMessage(socket.id, text, false);
    room.broadcast('chat_message', msg);
  }

  handleRoundEnd(room) {
    if (!room.game || room.game.phase === 'game_over') return;

    const { word, scores, wordOptions } = room.endRound();

    room.broadcast('round_end', {
      word,
      scores,
      nextDrawerId: room.game.getCurrentDrawerId(),
    });

    if (room.game.phase === 'game_over') {
      const sortedPlayers = room.getPlayersList().sort((a, b) => b.score - a.score);
      setTimeout(() => {
        room.broadcast('game_over', {
          winner: sortedPlayers[0],
          leaderboard: sortedPlayers
        });
        room.game = null;
      }, 4000);
      return;
    }

    // Start next turn after delay
    const drawerId = room.game.getCurrentDrawerId();
    setTimeout(() => {
      this.startNewTurn(room, drawerId, wordOptions);
    }, 4000);
  }

  handleDisconnect(socket) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room) return;

    const player = room.removePlayer(socket.id);
    if (!player) return;

    console.log(`${player.name} left room ${room.id}`);

    if (room.isEmpty()) {
      room.clearTimers();
      this.rooms.delete(room.id);
      console.log(`Room ${room.id} deleted (empty)`);
      return;
    }

    room.broadcast('player_left', {
      playerId: socket.id,
      playerName: player.name,
      players: room.getPlayersList(),
      newHostId: room.hostId
    });

    // If drawer disconnected, end round early
    if (room.game && socket.id === room.game.getCurrentDrawerId()) {
      room.clearTimers();
      setTimeout(() => this.handleRoundEnd(room), 2000);
    }
  }

  handleGetPublicRooms(socket) {
    const publicRooms = [];
    this.rooms.forEach((room) => {
      if (!room.settings.isPrivate && !room.isFull()) {
        publicRooms.push(room.toJSON());
      }
    });
    socket.emit('public_rooms', { rooms: publicRooms });
  }

  handleCanvasSync(socket) {
    const room = this.rooms.get(socket.data.roomId);
    if (!room || !room.game) return;
    socket.emit('canvas_sync', { strokes: room.game.canvasStrokes || [] });
  }
}

module.exports = MessageHandler;
