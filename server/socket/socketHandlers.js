const users = new Map();
const rooms = new Set(['general']);
const messageHistory = new Map();

const getUsersInRoom = (room) => {
  return [...users.values()].filter(user => user.room === room);
};

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', ({ username, room = 'general' }) => {
      users.set(socket.id, { 
        username, 
        typing: false, 
        room,
        id: socket.id 
      });
      
      socket.join(room);
      socket.emit('messageHistory', (messageHistory.get(room) || []).slice(-50));
      socket.emit('roomChanged', room);
      socket.to(room).emit('userJoined', username);
      io.to(room).emit('updateUsers', getUsersInRoom(room));
    });

    socket.on('message', ({ text, to, isPrivate }) => {
      const user = users.get(socket.id);
      if (user) {
        const messageData = {
          text,
          sender: user.username,
          senderId: socket.id,
          timestamp: new Date().toISOString(),
          id: Date.now(),
          isPrivate,
          to: isPrivate ? to : null,
          room: isPrivate ? null : user.room
        };

        if (isPrivate && to) {
          const recipient = [...users.values()].find(u => u.username === to);
          if (recipient) {
            socket.to(recipient.id).emit('privateMessage', messageData);
            socket.emit('privateMessage', messageData);
          }
        } else {
          io.to(user.room).emit('message', messageData);
          if (!messageHistory.has(user.room)) {
            messageHistory.set(user.room, []);
          }
          messageHistory.get(user.room).push(messageData);
        }
      }
    });

    socket.on('typing', (isTyping) => {
      const user = users.get(socket.id);
      if (user) {
        users.set(socket.id, { ...user, typing: isTyping });
        socket.to(user.room).emit('typing', {
          username: user.username,
          isTyping
        });
      }
    });

    socket.on('changeRoom', (newRoom) => {
      const user = users.get(socket.id);
      if (user) {
        socket.leave(user.room);
        socket.to(user.room).emit('userLeft', user.username);
        
        if (!rooms.has(newRoom)) {
          rooms.add(newRoom);
        }
        
        user.room = newRoom;
        socket.join(newRoom);
        socket.emit('roomChanged', newRoom);
        socket.to(newRoom).emit('userJoined', user.username);
        io.to(newRoom).emit('updateUsers', getUsersInRoom(newRoom));
      }
    });

    socket.on('createRoom', (roomName) => {
      if (!rooms.has(roomName)) {
        rooms.add(roomName);
        io.emit('newRoom', roomName);
      }
    });

    socket.on('loadMoreMessages', ({ room, beforeId }) => {
      const history = messageHistory.get(room) || [];
      const beforeIndex = history.findIndex(msg => msg.id === beforeId);
      
      if (beforeIndex > 0) {
        const start = Math.max(0, beforeIndex - 50);
        socket.emit('moreMessages', history.slice(start, beforeIndex));
      }
    });

    socket.on('disconnect', () => {
      const user = users.get(socket.id);
      if (user) {
        socket.to(user.room).emit('userLeft', user.username);
        users.delete(socket.id);
        io.to(user.room).emit('updateUsers', getUsersInRoom(user.room));
      }
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = { setupSocket };