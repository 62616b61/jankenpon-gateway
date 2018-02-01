const io = require('socket.io')
const EventEmitter = require('events')

class Player {
  constructor (id) {
    this.id = id
    this.room = null
    this.ready = false
    this.chose = true
  }

  reset () {
    this.chose = false
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
    this.io.attach(this.constants.PORT)
    console.log(`Player server port: ${this.constants.PORT}`)
  }

  listen () {
    this.io.on('connection', connection => {
      const player = new Player(connection.id)

      console.log('new connection', connection.id)

      connection.on('ready', () => this.events.emit('ready', player))
      connection.on('disconnect', () => {
        this.events.emit('disconnect', player)
        if (player.opponent) {
          this.io.to(player.opponent.id).emit('opponent-left')
        }
      })
      connection.on('choice', (shape) => {
        player.chose = true
        this.events.emit('choice', player, shape)
      })

      this.events.emit('connect', player)
    })
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
