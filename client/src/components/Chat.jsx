import { useState, useEffect, useRef } from 'react';
import { socket } from '../socket/socket';

export default function Chat() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [activeRecipient, setActiveRecipient] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);

  // Set username
  const handleSetUsername = () => {
    if (username.trim()) {
      socket.emit('set_username', username.trim());
    }
  };

  // Send message
  const sendMessage = () => {
    if (message.trim() && socket.data.username) {
      socket.emit('send_message', { text: message });
      setMessage('');
      setIsTyping(false);
    }
  };

  // Typing indicator
  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.emit('typing', false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [message, isTyping]);
  socket.on('private_message', (message) => {
  setPrivateMessages((prev) => [...prev, message]);
});

  // Socket event listeners
  useEffect(() => {
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user_typing', ({ username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping && !prev.includes(username)) {
          return [...prev, username];
        } else if (!isTyping) {
          return prev.filter((user) => user !== username);
        }
        return prev;
      });
    });

    socket.on('user_connected', (username) => {
      setUsers((prev) => [...prev, username]);
    });

    socket.on('user_disconnected', (username) => {
      setUsers((prev) => prev.filter((user) => user !== username));
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_connected');
      socket.off('user_disconnected');
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      {!socket.data?.username ? (
        <div className="username-form">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={handleSetUsername}>Join Chat</button>
        </div>
      ) : (
        <>
          <div className="chat-header">
            <h2>Global Chat</h2>
            <p>Online: {users.join(', ')}</p>
            {typingUsers.length > 0 && (
              <p>{typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...</p>
            )}
          </div>
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                <span className="sender">{msg.sender}</span>
                <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                <p className="text">{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="message-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}