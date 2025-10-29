import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Remove the complex build/rollupOptions for now. 
  // Vite should find index.html automatically when the root directory is set correctly.
  
  // Ensure base is set for Vercel deployment root hosting:
  base: '/', 
})