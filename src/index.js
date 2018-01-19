const constants = require('./config/constants')

const PlayerService = require('./services/PlayerService')

class Gateway {
  constructor () {
    this.p = new PlayerService(constants)
  }
}

new Gateway()
