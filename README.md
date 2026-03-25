# Real-Time Chat

Multi-room chat application with WebSocket-based real-time communication.

## Stack

- **Server** — Node.js, Express, Socket.io
- **Client** — React, Vite, React Router
- **Container** — Docker, docker-compose

## Features

- Create or join named chat rooms
- Real-time messaging (WebSockets via Socket.io)
- Typing indicators
- Online users list with per-user color coding
- System messages on join/leave
- In-memory message history per session

## Getting started

```bash
# Development
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

```bash
# Production (Docker)
docker-compose up --build
```

Server runs on port `3001`, client on port `5173` (dev) or `80` (Docker).

Copy `server/.env.example` to `server/.env` and adjust as needed.
