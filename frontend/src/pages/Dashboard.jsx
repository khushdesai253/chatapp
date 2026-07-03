import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import UserList from '../components/UserList';
import ChatWindow from '../components/ChatWindow';

function Dashboard({ user, onLogout }) {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io(import.meta.env.VITE_API_URL);
    setSocket(newSocket);

    // Register user with socket
    newSocket.on('connect', () => {
      newSocket.emit('register', user.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    // Fetch users list
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="dashboard-layout">
      <div className="glass-panel sidebar">
        <div className="sidebar-header">
          <h2>Hello, {user.username}</h2>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
        <UserList 
          users={users} 
          selectedUser={selectedUser} 
          onSelectUser={setSelectedUser} 
        />
      </div>
      <div className="glass-panel chat-window">
        {selectedUser ? (
          <ChatWindow 
            socket={socket} 
            currentUser={user} 
            selectedUser={selectedUser} 
          />
        ) : (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <h3>Select a user to start chatting</h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
