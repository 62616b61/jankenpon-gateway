const constants = require('./config/constants')

const PlayerService = require('./services/PlayerService')
const RoomService = require('./services/RoomService')

class Gateway {
  constructor () {
    this.p = new PlayerService(constants)
    this.r = new RoomService()

    this.subscribe()
  }

  subscribe () {
    this.p.on('ready', (player) => this.r.playerIsReady(player))
    this.p.on('choice', (player, shape) => this.r.playerChoice(player, shape))
  }
}

new Gateway()
