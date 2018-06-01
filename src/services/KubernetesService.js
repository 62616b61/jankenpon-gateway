const { RUNTIME } = require('../config/constants')
const podDef = require('../config/game-instance-pod.json')
const serviceDef = require('../config/game-instance-service.json')

const k8s = require('kubernetes-client')
const EventEmitter = require('events')

class KubernetesService {
  constructor () {
    this.core = new k8s.Core(Object.assign(
      {},
      k8s.config.getInCluster(),
      { namespace: 'default' }
    ))
    this.rooms = 0

    this.events = new EventEmitter()
  }

  spawnGameInstance () {
    console.log('SPAWN GAME INSTANCE')

    const id = this.rooms++

    const pod = JSON.parse(JSON.stringify(podDef))
    pod.metadata.name = pod.metadata.name + '-' + id
    pod.metadata.labels.room = id
    this.core.namespaces.pods.post({body: pod}, (a, b) => {
      console.log('POD SPAWN', a, b)
    })

    const service = JSON.parse(JSON.stringify(serviceDef))
    service.metadata.name = service.metadata.name + '-' + id
    service.spec.selector.room = id
    this.core.namespaces.services.post({body: service}, (a, b) => {
      console.log('SERVICE SPAWN', a, b)
    })

    const readinessInterval = setInterval(() => {
      this.core.ns.pods.matchLabels({ room: id }).get((err, res) => {
        if (err) throw err

        const conds = res.items && res.items[0].status.conditions || []
        const readinessCond = conds.length
          ? conds.find(c => c.type === 'Ready')
          : null
        const ready = readinessCond
          ? readinessCond.status === 'True'
          : false

        if (ready) {
          clearInterval(readinessInterval)

          const ip = res.items[0].status.podIP
          this.events.emit('instance-ready', id, ip)
        }
      });
    }, 1000)
  }

  on (event, callback) {
    const events = ['instance-ready']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = KubernetesService
