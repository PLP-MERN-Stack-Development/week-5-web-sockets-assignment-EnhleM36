import { useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const ChatMessages = ({ messages }) => {
  const { typingUsers, loadMoreMessages, hasMoreMessages, isLoadingMessages } = useSocket();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMoreMessages && !isLoadingMessages) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages, isLoadingMessages, loadMoreMessages]);

  return (
    <div className="chat-messages">
      <div className="messages-list" ref={messagesContainerRef}>
        {isLoadingMessages && <div className="loading-messages">Loading more messages...</div>}
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.isPrivate ? 'private' : ''}`}>
            <div className="message-header">
              <span className="sender">{msg.sender}</span>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              {msg.isPrivate && <span className="private-badge">Private</span>}
            </div>
            <div className="message-text">{msg.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
        </div>
      )}
    </div>
  );
};

export default ChatMessages;