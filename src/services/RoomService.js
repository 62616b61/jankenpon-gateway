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

    this.statusInterval = null
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

  roomIsReady (id, ip) {
    const room = this.findRoomById(id)
    room.ip = ip

    this.checkRoomStatus(room)
    this.events.emit('room-is-ready', room)
  }

  checkRoomStatus (room) {
    room.statusInterval = setInterval(() => {
      request(
        `http://${room.ip}:3000/status`,
        (err, res, body) => {
          console.log('room-status', err || body)

          if (body.state === 'finished') {
            const results = body.results
            const score = body.score

            console.log('game has finished', results, score)

            clearInterval(room.statusInterval)
          }
        }
      )
    }, 1000)
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
    const room = this.findRoomByPlayer(player)
    const playerNum = player.id === room.player1.id ? 0 : 1

    request(
      `http://${room.ip}:3000/choose/${playerNum}/${shape}`,
      (err, res) => console.log('room-choice', err || res.statusCode)
    )
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
