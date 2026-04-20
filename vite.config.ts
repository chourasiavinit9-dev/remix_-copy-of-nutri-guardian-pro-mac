import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
      ],
      define: {
        // Inject backend URL for Cloud Functions proxy — no API key on client!
        'process.env.VITE_BACKEND_URL': JSON.stringify(
          env.VITE_BACKEND_URL || 'http://localhost:5001/nutri-guardian-pro/us-central1'
        ),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

