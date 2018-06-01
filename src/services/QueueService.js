const uuid = require('uuid/v1')
const EventEmitter = require('events')

class QueueService {
  constructor () {
    this.queue = []

    this.events = new EventEmitter()
  }

  playerConnected (player) {
    this.queue.push(player)

    if (this.queue.length >= 2) {
      this.createRoom()
    }
  }

  playerDisconnected (player) {
    this.queue = this.queue.filter(p => p.id !== player.id)
  }

  createRoom () {
    const players = [this.queue[0], this.queue[1]]

    this.queue.shift()
    this.queue.shift()

    this.events.emit('preparing-room', players[0], players[1])
  }

  on (event, callback) {
    const events = ['preparing-room']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = QueueService
