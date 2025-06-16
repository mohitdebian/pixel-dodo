import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'localhost',
      'pixel-magic-ai.web.app',
      'pixel-magic-ai.firebaseapp.com',
      'pixelmagic.vercel.app',
      '4d40-2405-201-5c28-600b-62a-d30-d701-4b24.ngrok-free.app',
      'pixeldodo.vercel.app'
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  }
}); 