import 'dotenv/config'
import { createServer } from './server'

const PORT = parseInt(process.env.WS_PORT || '8080', 10)

const server = createServer()

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...')
  server.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...')
  server.close()
  process.exit(0)
})
