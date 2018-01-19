// Room service, eh?

const EventEmitter = require('events')

function Jankenpon (shape1, shape2) {
  const rules = [2, 0, 1]

  if (p0 === p1) return 0
  else if (rules[p0] === p1) return 1
  else return 2
}

class Room {
  constructor (player1, player2) {
    this.player1 = player1
    this.player2 = player2

    this.shape1 = null
    this.shape2 = null

    this.play()
  }

  play () {
    this.player1.play(player2)
    this.player2.play(player1)
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

  createRoomAndPlay () {
    const room = new Room(this.queue[0], this.queue[1])

    this.rooms.push(room)
    this.queue.shift()
    this.queue.shift()
  }

  playerDisconnected (player) {

  }

  playerIsReady (player) {
    player.ready()
    this.queue.push(player)

    if (this.queue.length >= 2) {
      createRoomAndPlay()
    }
  }

  playerChoice (player, shape) {
    const room = this.findRoomByPlayer(player)
  }

  on (event, callback) {
    const events = ['connect', 'disconnect', 'world/emit']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = RoomService
