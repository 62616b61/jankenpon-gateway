const { PORT } = require('../config/constants')

const server = require('http')
const io = require('socket.io')
const sillyname = require('sillyname')
const EventEmitter = require('events')

class Player {
  constructor (id, name) {
    this.id = id
    this.name = name
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
      const player = new Player(connection.id, sillyname())

      console.log('new connection', player.name, player.id)

      connection.on('ready', () => {
        this.events.emit('ready', player)
        connection.emit('generated-name', player.name)
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

  opponentFound (player1, player2) {
    this.io.to(player1.id).emit('opponent-found', player2.name)
    this.io.to(player2.id).emit('opponent-found', player1.name)
  }

  roomIsReady (room) {
    this.io.to(room.player1.id).emit('start')
    this.io.to(room.player2.id).emit('start')
  }

  announceResults (room, tie, winnerNum, score) {
    if (tie) {
      this.io.to(room.player1.id).emit('announcement', 'tie')
      this.io.to(room.player2.id).emit('announcement', 'tie')
    } else {
      const winner = winnerNum === 0 ? room.player1 : room.player2
      const looser = winnerNum === 0 ? room.player2 : room.player1

      console.log('announce results:', room, tie, winnerNum, score)

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
