import { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const RoomSelector = () => {
  const { currentRoom, rooms, changeRoom, createRoom } = useSocket();
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom(newRoomName);
      setNewRoomName('');
    }
  };

  return (
    <div className="room-selector">
      <h3>Rooms</h3>
      <ul>
        {rooms.map((room) => (
          <li
            key={room}
            className={room === currentRoom ? 'active' : ''}
            onClick={() => changeRoom(room)}
          >
            #{room}
          </li>
        ))}
      </ul>
      <form onSubmit={handleCreateRoom} className="create-room">
        <input
          type="text"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="New room name"
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default RoomSelector;