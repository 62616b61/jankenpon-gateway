const podDef = require('../../kubernetes/other/game-instance-pod.json')

const k8s = require('kubernetes-client')
const EventEmitter = require('events')


class KubernetesService {
  constructor () {
    this.core = new k8s.Core(k8s.config.fromKubeconfig())
    this.events = new EventEmitter()
  }

  spawnGameInstance (id) {
    const pod = JSON.parse(JSON.stringify(podDef))

    pod.metadata.name = pod.metadata.name + '-' + id
    pod.metadata.labels.room = id

    this.core.namespaces.pods.post({body: pod}, () => {})

    const readinessInterval = setInterval(() => {
      this.core.ns.pods.matchLabels({ room: id }).get((err, res) => {
        const conds = res.items[0].status.conditions || []
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
