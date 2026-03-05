const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const CLIENT = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({ origin: CLIENT }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT } });

const rooms = new Map();

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, roomName, username }) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { name: roomName, users: new Map(), messages: [] });
    }
    const room = rooms.get(roomId);
    room.users.set(socket.id, username);
    socket.join(roomId);
    socket.data = { roomId, username };

    const sys = { system: true, text: `${username} joined`, timestamp: Date.now() };
    room.messages.push(sys);

    socket.emit('room-history', {
      messages: room.messages,
      users: Array.from(room.users.values()),
    });
    socket.to(roomId).emit('user-joined', {
      username,
      users: Array.from(room.users.values()),
    });
  });

  socket.on('send-message', ({ roomId, text }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const msg = { username: socket.data.username, text, timestamp: Date.now() };
    room.messages.push(msg);
    io.to(roomId).emit('new-message', msg);
  });

  socket.on('typing', ({ roomId }) => {
    socket.to(roomId).emit('user-typing', { username: socket.data.username });
  });

  socket.on('stop-typing', ({ roomId }) => {
    socket.to(roomId).emit('user-stop-typing', { username: socket.data.username });
  });

  socket.on('disconnect', () => {
    const { roomId, username } = socket.data || {};
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    room.users.delete(socket.id);
    const sys = { system: true, text: `${username} left`, timestamp: Date.now() };
    room.messages.push(sys);
    io.to(roomId).emit('user-left', {
      username,
      users: Array.from(room.users.values()),
    });
    if (room.users.size === 0) rooms.delete(roomId);
  });
});

app.get('/api/rooms', (req, res) => {
  const list = Array.from(rooms.entries()).map(([id, r]) => ({
    id,
    name: r.name,
    userCount: r.users.size,
  }));
  res.json(list);
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
