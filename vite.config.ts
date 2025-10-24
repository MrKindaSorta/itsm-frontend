import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// Plugin to generate version.json during build
function generateVersionFile() {
  return {
    name: 'generate-version',
    closeBundle() {
      const version = {
        version: process.env.npm_package_version || '1.0.0',
        buildTime: new Date().toISOString(),
      }

      // Write to dist/version.json
      const distPath = path.resolve(__dirname, 'dist/version.json')
      fs.writeFileSync(distPath, JSON.stringify(version, null, 2))

      console.log('Generated version.json:', version)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generateVersionFile()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
