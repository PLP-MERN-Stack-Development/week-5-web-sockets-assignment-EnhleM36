import { useSocket } from '../context/SocketContext';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';
import UserList from '../components/UserList';
import RoomSelector from '../components/RoomSelector';

const ChatPage = () => {
  const { 
    username, 
    messages, 
    currentRoom, 
    privateMessages, 
    activeTab, 
    privateChatWith,
    isReconnecting,
    setActiveTab,
    setPrivateChatWith,
    clearUnreadCount
  } = useSocket();

  if (!username) return null;

  const handlePrivateChat = (user) => {
    setPrivateChatWith(user);
    setActiveTab('private');
    clearUnreadCount(user);
  };

  const currentMessages = activeTab === 'room' 
    ? messages 
    : privateMessages[privateChatWith] || [];

  return (
    <div className="chat-page">
      {isReconnecting && <div className="reconnecting">Reconnecting...</div>}
      <div className="chat-container">
        <div className="chat-sidebar">
          <RoomSelector />
          <UserList onUserClick={handlePrivateChat} />
        </div>
        <div className="chat-main">
          <div className="chat-tabs">
            <button
              className={activeTab === 'room' ? 'active' : ''}
              onClick={() => {
                setActiveTab('room');
                setPrivateChatWith(null);
              }}
            >
              #{currentRoom}
            </button>
            {privateChatWith && (
              <button
                className={activeTab === 'private' ? 'active' : ''}
                onClick={() => {
                  setActiveTab('private');
                  clearUnreadCount(privateChatWith);
                }}
              >
                @{privateChatWith}
              </button>
            )}
          </div>
          <ChatMessages messages={currentMessages} />
          <ChatInput 
            recipient={privateChatWith} 
            isPrivate={activeTab === 'private'} 
          />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;