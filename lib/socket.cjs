const { Server: SocketIOServer } = require('socket.io')

let io = null

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
        origin: '*',
        methods: ['GET', 'POST']
      }
    })

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('scan-barcode', (isbn) => {
        console.log('Received barcode scan:', isbn)
        socket.broadcast.emit('scan-barcode', { isbn })
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }
  return io
}

module.exports = {
  getIO,
  initSocket
} 