import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('✅ Socket conectado:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket desconectado:', reason);
});

socket.on('reconnect', (attempt) => {
  console.log('🔄 Socket reconectado:', attempt);
});

socket.on('connect_error', (err) => {
  console.log('⚠️ Error socket:', err.message);
});

export default socket;
