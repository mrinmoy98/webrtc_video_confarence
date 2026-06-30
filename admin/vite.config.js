import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Admin panel runs on :5174 (conference app is on :5173).
// It talks to the NestJS backend at VITE_API_URL (default http://localhost:4000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
  build: {
    outDir: 'dist',
  },
});
