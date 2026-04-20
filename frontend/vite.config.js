import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true,
        proxy: {
            '/api': 'http://localhost:8081',
            '/oauth2/authorization': 'http://localhost:8081',
            '/login/oauth2': 'http://localhost:8081',
            '/uploads': 'http://localhost:8081',
        }
    }
})
