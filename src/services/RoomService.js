// Room service, eh?

const uuid = require('uuid/v1')
const EventEmitter = require('events')

class Room {
  constructor (player1, player2) {
    this.id = uuid()
    this.player1 = player1
    this.player2 = player2
    this.instance = null
  }
}

class RoomService {
  constructor () {
    this.events = new EventEmitter()

    this.rooms = []
    this.queue = []
  }

  findRoomByPlayer (player) {
    return this.rooms.find(
      room => room.player1.id === player.id || room.player2.id === player.id
    )
  }

  findRoomById (id) {
    return this.rooms.find(room => room.id === id)
  }

  createRoom () {
    const room = new Room(this.queue[0], this.queue[1])

    this.rooms.push(room)
    this.queue.shift()
    this.queue.shift()

    this.events.emit('preparing-room', room)
  }

  instanceIsReady (id) {
    const room = this.findRoomById(id)
    this.events.emit('room-is-ready', room)
  }

  playerDisconnected (player) {

  }

  playerIsReady (player) {
    if (player.isReady) return

    player.ready()
    this.queue.push(player)

    if (this.queue.length >= 2) {
      this.createRoom()
    }
  }

  playerChoice (player, shape) {
    player.choice(shape)
    const room = this.findRoomByPlayer(player)

    room.choice()

    if (room.result) {
      this.events.emit('announcement', room)
    }
  }

  playerLeft (player) {
    this.queue = this.queue.filter(p => p.id !== player.id)
  }

  on (event, callback) {
    const events = ['preparing-room', 'room-is-ready', 'announcement']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = RoomService
