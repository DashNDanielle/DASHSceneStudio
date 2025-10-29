import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.', // ✅ ensure it points to project root
  build: {
    outDir: 'dist',
  },
})
