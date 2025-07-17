import { useSocket } from '../context/SocketContext';

const UserList = () => {
  const { users, setActiveTab, setPrivateChatWith, unreadCounts } = useSocket();

  const handleUserClick = (username) => {
    setActiveTab('private');
    setPrivateChatWith(username);
  };

  return (
    <div className="user-list">
      <h3>Online Users ({users.length})</h3>
      <ul>
        {users.map((user) => (
          <li 
            key={user.username} 
            onClick={() => handleUserClick(user.username)}
          >
            {user.username}
            {user.typing && <span className="typing-dot">...</span>}
            {unreadCounts[user.username] > 0 && (
              <span className="unread-count">{unreadCounts[user.username]}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;