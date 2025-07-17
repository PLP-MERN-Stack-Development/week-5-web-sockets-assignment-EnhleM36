import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket/socket';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [currentRoom, setCurrentRoom] = useState('general');
  const [rooms, setRooms] = useState(['general']);
  const [privateMessages, setPrivateMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [messageHistoryLoaded, setMessageHistoryLoaded] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [notificationSound] = useState(new Audio('/notification.mp3'));
  const [activeTab, setActiveTab] = useState('room');
  const [privateChatWith, setPrivateChatWith] = useState(null);

  const playNotificationSound = useCallback(() => {
    notificationSound.play().catch(e => console.log('Audio play failed:', e));
  }, [notificationSound]);

  const showNotification = useCallback((title, options) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification(title, options);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') new Notification(title, options);
      });
    }
  }, []);

  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      if (username) socket.emit('join', { username, room: currentRoom });
    };

    const onDisconnect = () => setIsConnected(false);
    const onReconnectAttempt = () => setIsReconnecting(true);
    const onReconnect = () => {
      setIsReconnecting(false);
      if (username) socket.emit('join', { username, room: currentRoom });
    };

    const onMessageEvent = (value) => setMessages(prev => [...prev, value]);
    const onMessageHistory = (history) => {
      setMessages(history);
      setMessageHistoryLoaded(true);
      setHasMoreMessages(history.length >= 50);
    };
    const onMoreMessages = (newMessages) => {
      setMessages(prev => [...newMessages, ...prev]);
      setHasMoreMessages(newMessages.length >= 50);
      setIsLoadingMessages(false);
    };

    const onPrivateMessage = (value) => {
      const key = value.isPrivate 
        ? value.sender === username ? value.to : value.sender
        : 'general';
      
      setPrivateMessages(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), value]
      }));

      if (!(value.sender === username) && 
          (!(activeTab === 'private') || !(privateChatWith === value.sender || privateChatWith === value.to))) {
        const notificationText = `New message from ${value.sender}: ${value.text.substring(0, 30)}...`;
        toast.info(notificationText);
        showNotification(`New message from ${value.sender}`, {
          body: value.text.substring(0, 100)
        });
        playNotificationSound();
        setUnreadCounts(prev => ({
          ...prev,
          [value.sender]: (prev[value.sender] || 0) + 1
        }));
      }
    };

    const onUpdateUsers = (usersList) => setUsers(usersList);
    const onTyping = ({ username, isTyping }) => {
      setTypingUsers(prev => isTyping 
        ? [...new Set([...prev, username])] 
        : prev.filter(user => user !== username)
      );
    };
    const onRoomChanged = (room) => {
      setCurrentRoom(room);
      setMessages([]);
      setMessageHistoryLoaded(false);
    };
    const onNewRoom = (room) => {
      setRooms(prev => prev.includes(room) ? prev : [...prev, room]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('reconnect', onReconnect);
    socket.on('message', onMessageEvent);
    socket.on('messageHistory', onMessageHistory);
    socket.on('moreMessages', onMoreMessages);
    socket.on('privateMessage', onPrivateMessage);
    socket.on('updateUsers', onUpdateUsers);
    socket.on('typing', onTyping);
    socket.on('roomChanged', onRoomChanged);
    socket.on('newRoom', onNewRoom);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('reconnect', onReconnect);
      socket.off('message', onMessageEvent);
      socket.off('messageHistory', onMessageHistory);
      socket.off('moreMessages', onMoreMessages);
      socket.off('privateMessage', onPrivateMessage);
      socket.off('updateUsers', onUpdateUsers);
      socket.off('typing', onTyping);
      socket.off('roomChanged', onRoomChanged);
      socket.off('newRoom', onNewRoom);
      socket.disconnect();
    };
  }, [username, currentRoom, activeTab, privateChatWith, playNotificationSound, showNotification]);

  const joinChat = (name) => {
    setUsername(name);
    if (socket.connected) socket.emit('join', { username: name, room: currentRoom });
  };

  const sendMessage = (text, to = null, isPrivate = false) => {
    if (text.trim() && username) socket.emit('message', { text, to, isPrivate });
  };

  const sendTyping = (isTyping) => {
    if (username) socket.emit('typing', isTyping);
  };

  const changeRoom = (room) => socket.emit('changeRoom', room);
  const createRoom = (roomName) => {
    if (roomName.trim() && !rooms.includes(roomName)) socket.emit('createRoom', roomName);
  };
  const loadMoreMessages = () => {
    if (messages.length > 0 && !isLoadingMessages) {
      setIsLoadingMessages(true);
      socket.emit('loadMoreMessages', { room: currentRoom, beforeId: messages[0].id });
    }
  };
  const clearUnreadCount = (user) => setUnreadCounts(prev => ({ ...prev, [user]: 0 }));

  return (
    <SocketContext.Provider value={{
      isConnected, isReconnecting, messages, users, typingUsers, username,
      currentRoom, rooms, privateMessages, unreadCounts, messageHistoryLoaded,
      hasMoreMessages, isLoadingMessages, activeTab, privateChatWith,
      joinChat, sendMessage, sendTyping, changeRoom, createRoom,
      loadMoreMessages, clearUnreadCount, setActiveTab, setPrivateChatWith
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);