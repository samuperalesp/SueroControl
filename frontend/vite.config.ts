import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/products': 'http://localhost:3000',
      '/terceros': 'http://localhost:3000',
      '/purchases': 'http://localhost:3000',
      '/sales': 'http://localhost:3000',
      '/packages': 'http://localhost:3000',
      '/inventory-movements': 'http://localhost:3000',
    },
  },
})
