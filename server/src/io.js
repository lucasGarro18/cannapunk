let _io = null

module.exports = {
  set: (io) => { _io = io },
  emit: (room, event, data) => { _io?.to(room).emit(event, data) },
  emitToUser: (userId, event, data) => { _io?.to(`user:${userId}`).emit(event, data) },
}
