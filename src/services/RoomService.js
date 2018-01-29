// Room service, eh?

const uuid = require('uuid/v1')
const request = require('request')
const EventEmitter = require('events')

const url = (id) => `jankenpon-game-room-svc-${id}.default.svc.cluster.local:3000`

class Room {
  constructor (player1, player2) {
    this.id = uuid()
    this.ip = null
    this.player1 = player1
    this.player2 = player2

    this.player1.room = this.id
    this.player2.room = this.id
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

  instanceIsReady (id, ip) {
    console.log('instance is ready', id, ip)
    const room = this.findRoomById(id)
    room.ip = ip

    this.events.emit('room-is-ready', room)
  }

  playerDisconnected (player) {

  }

  playerIsReady (player) {
    if (player.ready) return

    player.ready = true
    this.queue.push(player)

    if (this.queue.length >= 2) {
      this.createRoom()
    }
  }

  playerChoice (player, shape) {
    console.log('choice', player, shape)
    const room = this.findRoomByPlayer(player)

    request(`http://${room.ip}:3000/status`, function (error, response, body) {
      console.log('error:', error);
      console.log('statusCode:', response && response.statusCode);
      console.log('body:', body);
    })
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
