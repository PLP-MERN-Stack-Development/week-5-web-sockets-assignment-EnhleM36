import { useState } from 'react';
import { useSocket } from '../context/SocketContext';

const LoginForm = () => {
  const [name, setName] = useState('');
  const { joinChat } = useSocket();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) joinChat(name);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        required
      />
      <button type="submit">Join Chat</button>
    </form>
  );
};

export default LoginForm;