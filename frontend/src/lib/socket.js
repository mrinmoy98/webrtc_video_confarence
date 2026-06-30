import { io } from 'socket.io-client';

const BASE = import.meta.env.VITE_SIGNAL_URL || '';

export function createSocket() {
  return io(`${BASE}/meet`, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });
}
