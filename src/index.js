const PlayerService = require('./services/PlayerService')
const QueueService = require('./services/QueueService')
const KubernetesService = require('./services/KubernetesService')

class Gateway {
  constructor () {
    try {
      this.p = new PlayerService()
      this.q = new QueueService()
      this.k = new KubernetesService()

      this.subscribe()
    } catch (e) {
      console.error('Error:', e.message)
    }
  }

  subscribe () {
    this.p.on('connect', player => this.q.playerConnected(player))
    this.p.on('disconnect', player => this.q.playerDisconnected(player))

    this.q.on('preparing-room', (player1, player2) => {
      this.k.spawnGameInstance()
      this.p.opponentFound(player1, player2)
    })
    this.q.on('room-is-ready', room => this.p.roomIsReady(room))

    this.k.on('instance-ready', (id, ip) => this.p.roomIsReady(id, ip))
  }
}

new Gateway()
