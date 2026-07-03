import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function ChatWindow({ socket, currentUser, selectedUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Fetch initial chat history when selectedUser changes
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/messages/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      // Only append if it belongs to the current conversation
      if (
        (message.sender === selectedUser._id && message.receiver === currentUser.id) ||
        (message.sender === currentUser.id && message.receiver === selectedUser._id)
      ) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket, currentUser, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      sender: currentUser.id,
      receiver: selectedUser._id,
      content: newMessage.trim(),
      createdAt: new Date().toISOString()
    };

    // Optimistically add to UI
    setMessages(prev => [...prev, messageData]);

    // Send through socket
    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="chat-header">
        <div className="avatar">
          {selectedUser.username.charAt(0)}
        </div>
        <h3>{selectedUser.username}</h3>
      </div>
      <div className="chat-messages">
        {messages.map((msg, idx) => {
          const isSent = msg.sender === currentUser.id;
          return (
            <div key={idx} className={`message ${isSent ? 'sent' : 'received'}`}>
              <div className="message-content">{msg.content}</div>
              <span className="message-time">{formatTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-container" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          className="chat-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </>
  );
}

export default ChatWindow;
