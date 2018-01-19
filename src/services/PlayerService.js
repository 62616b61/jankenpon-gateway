const io = require('socket.io')
const EventEmitter = require('events')

const events = ['connect', 'disconnect', 'choose']

class PlayerService {
  constructor (constants) {
    this.constants = constants
    this.io = io()

    this.setup()
    this.listen()

    this.events = new EventEmitter()
  }

  setup () {
    this.io.attach(this.constants.PLAYER_SOCKET_PORT)
    console.log(`Player server port: ${this.constants.PLAYER_SOCKET_PORT}`)
  }

  listen () {
    this.io.on('connection', connection => {
      this.events.emit('connect', player)
    })
  }

  on (event, callback) {
    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = PlayerService
