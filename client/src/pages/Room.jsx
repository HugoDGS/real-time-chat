import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const username = sessionStorage.getItem('username');

  useEffect(() => {
    if (!username) { navigate('/'); return; }

    const onHistory = ({ messages, users }) => {
      setMessages(messages);
      setUsers(users);
    };
    const onMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const onJoined = ({ users }) => setUsers(users);
    const onLeft = ({ users }) => setUsers(users);

    const onTyping = ({ username: u }) => setTyping((t) => [...new Set([...t, u])]);
    const onStopTyping = ({ username: u }) => setTyping((t) => t.filter((x) => x !== u));

    socket.on('room-history', onHistory);
    socket.on('new-message', onMessage);
    socket.on('user-joined', onJoined);
    socket.on('user-left', onLeft);
    socket.on('user-typing', onTyping);
    socket.on('user-stop-typing', onStopTyping);

    return () => {
      socket.off('room-history', onHistory);
      socket.off('new-message', onMessage);
      socket.off('user-joined', onJoined);
      socket.off('user-left', onLeft);
      socket.off('user-typing', onTyping);
      socket.off('user-stop-typing', onStopTyping);
    };
  }, [username, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    socket.emit('send-message', { roomId, text: text.trim() });
    socket.emit('stop-typing', { roomId });
    clearTimeout(typingTimer.current);
    setText('');
  };

  const handleInput = (e) => {
    setText(e.target.value);
    socket.emit('typing', { roomId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('stop-typing', { roomId }), 1500);
  };

  const leave = () => {
    socket.disconnect();
    navigate('/');
  };

  const userColors = {};
  users.forEach((u, i) => {
    userColors[u] = `hsl(${(i * 67 + 200) % 360}, 70%, 65%)`;
  });

  return (
    <div className="room">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Members</h2>
          <span className="online-count">{users.length}</span>
        </div>
        <ul className="users-list">
          {users.map((u) => (
            <li key={u} className="user-item">
              <span className="user-dot" style={{ background: userColors[u] }} />
              {u}
              {u === username && <span className="you">(you)</span>}
            </li>
          ))}
        </ul>
        <button className="btn-leave" onClick={leave}>← Leave room</button>
      </aside>

      <div className="chat">
        <div className="messages">
          {messages.map((m, i) =>
            m.system ? (
              <p key={i} className="system-msg">{m.text}</p>
            ) : (
              <div key={i} className={`bubble${m.username === username ? ' own' : ''}`}>
                {m.username !== username && (
                  <span className="bubble-user" style={{ color: userColors[m.username] }}>
                    {m.username}
                  </span>
                )}
                <p className="bubble-text">{m.text}</p>
                <span className="bubble-time">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          )}
          {typing.filter((u) => u !== username).length > 0 && (
            <p className="typing-indicator">
              {typing.filter((u) => u !== username).join(', ')} is typing...
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-bar">
          <input
            className="chat-input"
            value={text}
            onChange={handleInput}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message..."
            autoFocus
          />
          <button className="btn-send" onClick={send} disabled={!text.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
