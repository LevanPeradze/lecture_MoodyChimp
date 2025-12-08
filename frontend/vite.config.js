import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': process.env.VITE_API_BASE_URL || 'http://localhost:4000'
    }
  },
  optimizeDeps: {
    exclude: []
  },
  define: {
    // Make environment variables available in the app
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:4000')
  }
});

