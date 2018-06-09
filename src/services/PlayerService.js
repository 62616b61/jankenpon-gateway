const { PORT } = require('../config/constants')

const server = require('http')
const io = require('socket.io')
const sillyname = require('sillyname')
const EventEmitter = require('events')

class Player {
  constructor (id, name) {
    this.id = id
    this.name = name
  }
}

class PlayerService {
  constructor () {
    this.server = server.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('okay');
    })

    this.io = io(this.server)
    this.events = new EventEmitter()

    this.setup()
    this.listen()
  }

  setup () {
    this.server.listen(PORT)
    console.log(`Player server port: ${PORT}`)
  }

  listen () {
    this.io.on('connection', connection => {
      const player = new Player(connection.id, sillyname())

      connection.on('disconnect', () => this.events.emit('disconnect', player))
      connection.emit('generated-name', player.name)
      this.events.emit('connect', player)

      console.log('new connection', player.name, player.id)
    })
  }

  opponentFound (player1, player2) {
    this.io.to(player1.id).emit('opponent-found', player2.name)
    this.io.to(player2.id).emit('opponent-found', player1.name)
  }

  roomIsReady (player1, player2, port) {
    this.io.to(player1.id).emit('room-is-ready', port)
    this.io.to(player2.id).emit('room-is-ready', port)
  }

  on (event, callback) {
    const events = ['connect', 'disconnect']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = PlayerService
