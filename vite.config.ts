import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      

      proxy: {
        // Proxy /api → backend, và bỏ /api đi vì backend không có prefix /api
        '/api': {
          target: 'http://localhost:5000',          // ← thay bằng port backend thật (thường 5000, 4000, 8000...)
          changeOrigin: true,
          secure: false,

          // Quan trọng: bỏ /api đi để gọi đúng /search trên backend
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});