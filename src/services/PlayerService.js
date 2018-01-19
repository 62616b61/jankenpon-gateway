const io = require('socket.io')
const EventEmitter = require('events')


class Player {
  constructor (id) {
    this.id = id
    this.opponent = null
    this.isPlaying = false
    this.isReady = false
  }

  ready () {
    this.ready = true
  }

  play (opponent) {
    this.room = room
    this.opponent = opponent
    this.isPlaying = true
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
      connection.on('choose', shape => this.events.emit('choose', player, shape))

      this.events.emit('connect', player)
    })
  }

  on (event, callback) {
    const events = ['connect', 'disconnect', 'choose', 'ready']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = PlayerService
