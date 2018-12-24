const server = require('http').createServer()
const express = require('express')
const io = require('socket.io')(server)
const app = express()

let queue = []

io.on('connection', socket => {
  socket.on('new', () => {
    if (queue.length > 0) {
      const room = queue[0]

      socket.join(room)
      socket.room = room

      queue.splice(0, 1)

      io.to(room).emit('started', room)
    } else {
      queue.push(socket.id)

      socket.join(socket.id)
      socket.room = socket.id

      socket.emit('pending')
    }
  })

  socket.on('join', room => {
    const roomSockets = io.sockets.adapter.rooms[room]
    const hasStranger = roomSockets ? !!Object.keys(roomSockets.sockets)[0] : false

    socket.join(room)
    socket.room = room

    socket.broadcast.to(room).emit('connected')
    socket.emit('joined', hasStranger)
  })

  socket.on('leave', room => {
    socket.leave(room)
    socket.broadcast.to(room).emit('leave')
    delete socket.room
  })

  socket.on('message', message => {
    socket.broadcast.to(socket.room).emit('message', message)
  })

  socket.on('typing', () => {
    socket.broadcast.to(socket.room).emit('typing')
  })

  socket.on('disconnect', () => {
    const index = queue.indexOf(socket.id)

    if (index != -1) {
      queue.splice(index, 1)
    } else if (socket.room) {
      socket.broadcast.to(socket.room).emit('disconnected')
    }
  })
})

server.listen(3000, () => console.log('Strangerchat API listening on port 3000!'))
