import { io } from 'socket.io-client';

const URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';

export const socket = io(URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5
});