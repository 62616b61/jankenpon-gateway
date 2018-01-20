// Room service, eh?

const EventEmitter = require('events')

const name = ['rock', 'paper', 'scissors']

function Jankenpon (shape1, shape2) {
  const rules = [2, 0, 1]

  if (shape1 === shape2) return 0
  else if (rules[shape1] === shape2) return 1
  else return 2
}

class Room {
  constructor (player1, player2) {
    this.player1 = player1
    this.player2 = player2
    this.result = null
    this.winner = null

    this.play()
  }

  play () {
    this.player1.play(this.player2)
    this.player2.play(this.player1)
  }

  jankenpon () {
    const result = Jankenpon(this.player1.shape, this.player2.shape)

    if (result === 0) {
      this.result = 'tie'
    } else {
      this.result = true
      this.winner = result === 1 ? this.player1 : this.player2
    }
  }

  choice () {
    if (this.player1.hasMadeChoice() && this.player2.hasMadeChoice()) {
      this.jankenpon()
    }
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

    this.events.emit('start', room.player1)
  }

  playerDisconnected (player) {

  }

  playerIsReady (player) {
    if (player.isReady) return

    player.ready()
    this.queue.push(player)

    if (this.queue.length >= 2) {
      this.createRoomAndPlay()
    }
  }

  playerChoice (player, shape) {
    player.choice(shape)
    const room = this.findRoomByPlayer(player)

    room.choice()

    if (room.result) {
      this.events.emit('announce', room)
    }
  }

  playerLeft (player) {
    this.queue = this.queue.filter(p => p.id !== player.id)
  }

  on (event, callback) {
    const events = ['announce', 'start']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = RoomService
