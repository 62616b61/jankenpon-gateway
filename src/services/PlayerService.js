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
    this.ready = true
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
    return !!this.shape
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
    console.log(`Player server port: ${this.constants.PLAYER_SOCKET_PORT}`)
  }

  listen () {
    this.io.on('connection', connection => {
      const player = new Player(connection.id)

      connection.on('ready', () => this.events.emit('ready', player))
      connection.on('disconnect', () => this.events.emit('disconnect', player))
      connection.on('choice', (shape) => {
        player.choice(shape)
        this.events.emit('choice', player)
      })


      this.events.emit('connect', player)
      this.events.emit('ready', player)
    })
  }

  announceResults (winner) {
    this.io.to(winner.id).emit('win')
    this.io.to(winner.opponent.id).emit('lose')

    winner.reset()
    winner.opponent.reset()
  }

  on (event, callback) {
    const events = ['connect', 'disconnect', 'choice', 'ready']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = PlayerService
