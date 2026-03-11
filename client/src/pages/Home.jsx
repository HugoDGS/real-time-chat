import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';

const API = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function Home() {
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await axios.get(`${API}/api/rooms`);
      setRooms(data);
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const joinRoom = (roomId, roomName) => {
    if (!username.trim()) return;
    sessionStorage.setItem('username', username.trim());
    socket.connect();
    socket.emit('join-room', { roomId, roomName, username: username.trim() });
    navigate(`/room/${roomId}`);
  };

  const createRoom = () => {
    if (!newRoom.trim() || !username.trim()) return;
    const id = newRoom.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
    joinRoom(id, newRoom.trim());
  };

  return (
    <div className="home">
      <div className="home-card">
        <h1>Chat</h1>
        <p className="home-subtitle">Real-time group conversations</p>

        <div className="form-group">
          <label>Your username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter a username..."
            maxLength={20}
            onKeyDown={(e) => e.key === 'Enter' && newRoom && createRoom()}
          />
        </div>

        <div className="rooms-section">
          <h3>Active rooms</h3>
          {rooms.length === 0 ? (
            <p className="empty">No active rooms — create one below</p>
          ) : (
            <div className="rooms-list">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  className="room-btn"
                  onClick={() => joinRoom(r.id, r.name)}
                  disabled={!username.trim()}
                >
                  <span className="room-name"># {r.name}</span>
                  <span className="room-count">{r.userCount} online</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="create-section">
          <h3>Create a room</h3>
          <div className="create-row">
            <input
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              placeholder="Room name..."
              onKeyDown={(e) => e.key === 'Enter' && createRoom()}
            />
            <button
              className="btn-create"
              onClick={createRoom}
              disabled={!username.trim() || !newRoom.trim()}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
