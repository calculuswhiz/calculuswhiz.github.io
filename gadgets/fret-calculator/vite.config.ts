import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const base = (command === 'serve')
    ? ''
    : '/gadgets/fret-calculator/dist/';

  return ({
    plugins: [react()],
    base: base,
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    }
  });
});
