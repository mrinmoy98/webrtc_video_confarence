import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The backend (NestJS + Socket.IO signaling) runs on :4000.
// In dev, Vite serves the UI on :5173 and the app connects to the
// backend directly via VITE_SIGNAL_URL (see src/lib/socket.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
  },
});
