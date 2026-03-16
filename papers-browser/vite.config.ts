import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5185,
    proxy: {
      '/api': {
        target: 'https://collections.calacademy.org',
        changeOrigin: true,
      },
      '/tiles': {
        target: 'https://collections.calacademy.org',
        changeOrigin: true,
      },
      '/static': {
        target: 'https://collections.calacademy.org',
        changeOrigin: true,
      },
    },
  },
});
