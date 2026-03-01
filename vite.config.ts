import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: "/From-Tools-to-Spatial-AI-Agents/",
  plugins: [
    tailwindcss(),
    react()
  ],
})
