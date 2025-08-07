const { Server: SocketIOServer } = require('socket.io')

let io = null
const scannerDevices = new Set()
const sessionScanners = new Map() // Track which session has scanner devices

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized')
  }
  return io
}

const initSocket = (server) => {
  if (!io) {
    io = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: ['http://localhost:3000', 'https://*.ngrok-free.app', 'https://*.ngrok.io', 'https://*.ar-sight.com'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      allowEIO3: true,
      transports: ['polling', 'websocket']
    })

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)
      const sessionId = socket.handshake.query.sessionId
      console.log('Session ID:', sessionId)

      // Join the session room
      if (sessionId) {
        socket.join(sessionId)
        console.log(`Client ${socket.id} joined session ${sessionId}`)
      }

      // Check if this is a scanner device (has camera access)
      socket.on('scanner-device', () => {
        console.log('Scanner device connected:', socket.id, 'for session:', sessionId)
        scannerDevices.add(socket.id)
        if (sessionId) {
          sessionScanners.set(sessionId, true)
          // Notify other clients in the same session that a scanner is connected
          console.log(`Emitting scanner-connected to session ${sessionId}`)
          socket.to(sessionId).emit('scanner-connected')
        }
      })

      socket.on('scan-barcode', (isbn) => {
        console.log('Received barcode scan:', isbn, 'from session:', sessionId)
        // Only broadcast to the same session
        if (sessionId) {
          console.log(`Emitting scan-barcode to session ${sessionId}`)
          socket.to(sessionId).emit('scan-barcode', { isbn })
        }
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id, 'from session:', sessionId)
        // Check if this was a scanner device
        if (scannerDevices.has(socket.id)) {
          scannerDevices.delete(socket.id)
          if (sessionId) {
            sessionScanners.delete(sessionId)
            // Notify other clients in the same session that scanner disconnected
            console.log(`Emitting scanner-disconnected to session ${sessionId}`)
            socket.to(sessionId).emit('scanner-disconnected')
          }
        }
      })
    })
  }
  return io
}

module.exports = {
  getIO,
  initSocket
} 