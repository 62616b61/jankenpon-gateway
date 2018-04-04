const { PORT } = require('../config/constants')

const server = require('http')
const io = require('socket.io')
const sillyname = require('sillyname')
const EventEmitter = require('events')

class Player {
  constructor (id) {
    this.id = id
    this.ready = false
    this.chose = true
  }

  reset () {
    this.chose = false
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
      const player = new Player(connection.id)
      const name = sillyname()

      console.log('new connection', name, connection.id)

      connection.on('ready', () => {
        this.events.emit('ready', player)
        connection.emit('generated-name', name)
      })
      connection.on('disconnect', () => this.events.emit('disconnect', player))
      connection.on('choice', (shape) => {
        player.chose = true
        this.events.emit('choice', player, shape)
      })

      this.events.emit('connect', player)
    })
  }

  opponentLeft (player) {
    this.io.to(player.id).emit('opponent-left')
  }

  roomIsBeingPrepared (room) {
    this.io.to(room.player1.id).emit('room-is-being-prepared')
    this.io.to(room.player2.id).emit('room-is-being-prepared')
  }

  roomIsReady (room) {
    this.io.to(room.player1.id).emit('start')
    this.io.to(room.player2.id).emit('start')
  }

  announceResults (room, results, score) {
    if (results.tie) {
      this.io.to(room.player1.id).emit('announcement', 'tie')
      this.io.to(room.player2.id).emit('announcement', 'tie')
    } else {
      const winner = results.winner === 0 ? room.player1 : room.player2
      const looser = results.winner === 0 ? room.player2 : room.player1

      console.log('announce results:', room, results, score)

      this.io.to(winner.id).emit('announcement', 'win')
      this.io.to(looser.id).emit('announcement', 'lose')
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
