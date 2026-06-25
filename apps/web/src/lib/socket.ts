import { io, Socket } from 'socket.io-client';

import { useAuthStore } from '@/stores/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${API_URL}/realtime`, {
      auth: { token: useAuthStore.getState().accessToken },
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}

// Reconnect with the rotated token on login/refresh; disconnect on logout.
useAuthStore.subscribe((state, prevState) => {
  if (state.accessToken === prevState.accessToken) return;
  disconnectSocket();
  if (state.accessToken) connectSocket();
});
