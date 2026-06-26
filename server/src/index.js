const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const MessageHandler = require('./MessageHandler');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Serve static frontend in production
const clientBuild = path.join(__dirname, '../../client/dist');
app.use(express.static(clientBuild));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// Global rooms store
const rooms = new Map();
const handler = new MessageHandler(io, rooms);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('create_room', (data) => handler.handleCreateRoom(socket, data));
  socket.on('join_room', (data) => handler.handleJoinRoom(socket, data));
  socket.on('start_game', () => handler.handleStartGame(socket));
  socket.on('word_chosen', (data) => handler.handleWordChosen(socket, data));

  // Drawing events
  socket.on('draw_start', (data) => handler.handleDrawStart(socket, data));
  socket.on('draw_move', (data) => handler.handleDrawMove(socket, data));
  socket.on('draw_end', () => handler.handleDrawEnd(socket));
  socket.on('canvas_clear', () => handler.handleCanvasClear(socket));
  socket.on('draw_undo', () => handler.handleUndo(socket));
  socket.on('canvas_sync_request', () => handler.handleCanvasSync(socket));

  // Chat & guessing
  socket.on('guess', (data) => handler.handleGuess(socket, data));
  socket.on('chat', (data) => handler.handleChat(socket, data));

  // Room browsing
  socket.on('get_public_rooms', () => handler.handleGetPublicRooms(socket));

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    handler.handleDisconnect(socket);
  });
});

// Catch-all: serve React app
app.get('*', (req, res) => {
  const indexPath = path.join(clientBuild, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(200).send('Skribbl Clone Server Running');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
