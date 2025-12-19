
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error.
  // Standard Vite usage of process.cwd() often requires explicit Node typing in some environments.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env': {
        API_KEY: apiKey
      }
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html'
        }
      }
    }
  };
});
