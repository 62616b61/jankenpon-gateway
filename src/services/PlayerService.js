const io = require('socket.io')
const EventEmitter = require('events')


class Player {
  constructor (id) {
    this.id = id
    this.opponent = null
    this.shape = null
    this.isPlaying = false
    this.isReady = false
  }

  ready () {
    this.isReady = true
  }

  reset () {
    this.opponent = null
    this.shape = null
    this.isPlaying = false
    this.isReady = false
  }

  play (opponent) {
    this.opponent = opponent
    this.isPlaying = true
  }

  choice (shape) {
    this.shape = shape
  }

  hasMadeChoice () {
    return this.shape !== null
  }
}

class PlayerService {
  constructor (constants) {
    this.constants = constants
    this.io = io()
    this.events = new EventEmitter()

    this.setup()
    this.listen()
  }

  setup () {
    this.io.attach(this.constants.PLAYER_SOCKET_PORT)
    console.log(`Player server port: ${this.constants.PORT}`)
  }

  listen () {
    this.io.on('connection', connection => {
      const player = new Player(connection.id)

      console.log('new connection', connection.id)

      connection.on('ready', () => this.events.emit('ready', player))
      connection.on('disconnect', () => this.events.emit('disconnect', player))
      connection.on('choice', (shape) => {
        this.events.emit('choice', player, shape)
      })


      this.events.emit('connect', player)
    })
  }

  opponentFound (player) {
    this.io.to(player.id).emit('start')
    this.io.to(player.opponent.id).emit('start')
  }

  announceResults (room) {
    if (room.result === 'tie') {
      this.io.to(room.player1.id).emit('announce', 'tie')
      this.io.to(room.player1.opponent.id).emit('announce', 'tie')
    } else {
      this.io.to(room.winner.id).emit('announce', 'win')
      this.io.to(room.winner.opponent.id).emit('announce', 'lose')
    }

    room.player1.reset()
    room.player2.reset()
  }

  on (event, callback) {
    const events = ['connect', 'disconnect', 'choice', 'ready']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = PlayerService
