# 🎨 Skribbl Clone

A full-stack multiplayer drawing and guessing game (Pictionary-style), inspired by skribbl.io.

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+ and npm

### 1. Install dependencies

```bash
npm run install:all
# OR manually:
cd server && npm install
cd ../client && npm install
```

### 2. Build the client

```bash
cd client && npm run build
```

### 3. Start the server

```bash
cd server && npm start
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🛠️ Development Mode (Hot Reload)

Install root devDependencies first:

```bash
npm install
```

Then run both server and client in parallel:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 🏗️ Architecture Overview

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Canvas | HTML5 Canvas API |
| Backend | Node.js + Express |
| WebSockets | Socket.IO 4 |
| Database | In-memory (no DB needed for MVP) |

### Project Structure
```
skribbl-clone/
├── server/
│   └── src/
│       ├── index.js          # Express + Socket.IO setup
│       ├── Player.js         # Player class (OOP)
│       ├── Game.js           # Game class (rounds, scoring, turns)
│       ├── Room.js           # Room class (players, broadcasting)
│       ├── MessageHandler.js # All socket event handlers
│       └── words.js          # Word lists by category
└── client/
    └── src/
        ├── pages/
        │   ├── Home.jsx      # Landing / lobby creation
        │   ├── Lobby.jsx     # Pre-game lobby
        │   └── Game.jsx      # Main game screen
        ├── components/
        │   ├── DrawingCanvas.jsx  # Canvas + toolbar
        │   ├── Chat.jsx          # Chat & guess panel
        │   ├── PlayerList.jsx    # Scoreboard sidebar
        │   ├── WordSelection.jsx # Word picker overlay
        │   ├── GameOver.jsx      # End screen + leaderboard
        │   └── PublicRooms.jsx   # Browse open rooms
        └── hooks/
            ├── useSocket.js  # Socket.IO connection hook
            └── useCanvas.js  # Drawing logic hook
```

### WebSocket Flow

```
Client                     Server
  |                           |
  |-- create_room ----------->|
  |<-- room_created -----------|
  |                           |
  |-- start_game ------------>|
  |<-- game_started -----------|
  |<-- word_options ----------- (drawer only)
  |                           |
  |-- word_chosen ----------->|
  |<-- round_drawing ----------|  (all players)
  |                           |
  |-- draw_start/move/end --->|
  |<-- draw_data ------------- (all others)
  |                           |
  |-- guess ----------------->|
  |<-- guess_result ---------- (broadcast)
  |                           |
  |<-- round_end ------------ (timer or all guessed)
  |<-- game_over ------------ (all rounds done)
```

### OOP Design
- **`Player`** — name, score, avatar, round state
- **`Game`** — current word, hints, timer, stroke history, scoring
- **`Room`** — player map, game instance, broadcaster, timer management
- **`MessageHandler`** — dispatches all socket events to Room/Game methods

### Drawing Sync
1. Drawer's mouse/touch events → captured as `{x, y, color, size, tool}`
2. Sent via `draw_start` / `draw_move` / `draw_end` events
3. Server receives → broadcasts `draw_data` to all other clients
4. Clients replay strokes on their canvas using the same drawing primitives
5. `canvas_sync` event lets late joiners get the full stroke history

### Scoring
- Correct guess: `100 + (timeLeft/drawTime) * 150` base points
- First guesser: +50 bonus
- Drawer: 50% of each guesser's points

---

## 🌐 Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set:
   - **Build Command:** `npm run install:all && npm run build:client`
   - **Start Command:** `npm start`
   - **Root Directory:** `/` (the repo root)
4. Live URL: `https://your-app.onrender.com`

---

## ✅ Features

### Core (Must Have) ✅
- [x] Create room with configurable settings
- [x] Join room via code or link
- [x] Lobby with player list; host starts game
- [x] Turn-based rounds: one drawer, others guess
- [x] Real-time drawing sync (strokes visible to all)
- [x] Word selection for drawer (1–5 choices)
- [x] Guessing: type word, get points for correct guess
- [x] Scoring and leaderboard
- [x] Game end with winner screen
- [x] Basic drawing tools: brush, colors, eraser, undo, clear

### Should Have ✅
- [x] Hints (reveal letters over time)
- [x] Chat (guesses + general chat)
- [x] Draw time countdown
- [x] Private rooms (invite link)

### Bonus ✅
- [x] OOP architecture (Player, Game, Room, MessageHandler)
- [x] Word categories (animals, objects, food, actions, places, nature)
- [x] Public room browser
- [x] Avatars (emoji-based)
- [x] Canvas sync for late joiners
- [x] Auto word pick if drawer idles
