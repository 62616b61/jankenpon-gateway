// Room service, eh?

const uuid = require('uuid/v1')
const request = require('request')
const EventEmitter = require('events')

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

  roomIsReady (id, ip) {
    const room = this.findRoomById(id)
    room.ip = ip

    this.checkRoomStatus(room)
    this.events.emit('room-is-ready', room)
  }

  checkRoomStatus (room) {
    const statusInterval = setInterval(() => {
      request(
        `http://${room.ip}:3000/status`,
        (err, res, body) => {
          if (err) {
            clearInterval(statusInterval)
            return
          }

          const data = JSON.parse(body)

          if (data.state === 'finished') {
            const results = data.results
            const score = data.score
            const tie = data.tie
            const winner = data.winner

            request(
              `http://${room.ip}:3000/reset`,
              (err, res) => {
                if (err) console.log('room-reset', err)

                console.log('game has finished', tie, winner, score)
                this.events.emit('announcement', room, tie, winner, score)

                room.player1.reset()
                room.player2.reset()

                this.checkRoomStatus(room)
              }
            )

            clearInterval(statusInterval)
          }
        }
      )
    }, 1000)
  }

  playerDisconnected (player) {
    if (!player.ready) return

    const room = this.findRoomByPlayer(player)

    if (room) {
      const opponent = room.player1.id === player.id
        ? room.player2
        : room.player1

      this.rooms = this.rooms.filter(r => r.id !== room.id)
      this.events.emit('opponent-left', opponent, room)
    } else {
      this.queue = this.queue.filter(p => p.id !== player.id)
    }
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

    console.log('player has made a choice:', room, playerNum, player.id, shape)

    request(
      `http://${room.ip}:3000/choose?player=${playerNum}&shape=${shape}`,
      (err, res) => console.log('room-choice', err || res.statusCode)
    )
  }

  on (event, callback) {
    const events = ['opponent-left', 'preparing-room', 'room-is-ready', 'announcement']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = RoomService
