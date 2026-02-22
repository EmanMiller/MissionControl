import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages (repo name as subdirectory)
  // Uses '/' locally and in custom-domain setups
  base: process.env.GITHUB_ACTIONS ? '/MissionControl/' : '/',
});
