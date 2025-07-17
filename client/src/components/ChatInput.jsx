import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const ChatInput = ({ recipient = null, isPrivate = false }) => {
  const [message, setMessage] = useState('');
  const { sendMessage, sendTyping } = useSocket();
  const typingTimeout = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message, recipient, isPrivate);
      setMessage('');
      sendTyping(false);
    }
  };

  useEffect(() => {
    if (message.trim()) {
      sendTyping(true);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => sendTyping(false), 2000);
    } else {
      sendTyping(false);
    }

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, [message, sendTyping]);

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={isPrivate ? `Message ${recipient}` : 'Type a message...'}
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default ChatInput;