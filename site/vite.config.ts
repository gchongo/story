import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storyRoot = path.resolve(__dirname, '..')

function storyContentPlugin(): Plugin {
  return {
    name: 'story-content',
    configureServer(server) {
      server.middlewares.use('/content', (req, res, next) => {
        if (!req.url) return next()
        const decoded = decodeURIComponent(req.url.split('?')[0])
        const filePath = path.join(storyRoot, decoded)
        if (!filePath.startsWith(storyRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          res.statusCode = 404
          res.end('Not found')
          return
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        fs.createReadStream(filePath).pipe(res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/content', (req, res, next) => {
        if (!req.url) return next()
        const decoded = decodeURIComponent(req.url.split('?')[0])
        const filePath = path.join(storyRoot, decoded)
        if (!filePath.startsWith(storyRoot) || !fs.existsSync(filePath)) {
          res.statusCode = 404
          res.end('Not found')
          return
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), storyContentPlugin()],
  server: {
    fs: { allow: [storyRoot] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
