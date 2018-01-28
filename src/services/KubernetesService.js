const pod = require('../../kubernetes/pod.json')
const k8s = require('kubernetes-client')
const EventEmitter = require('events')


class KubernetesService {
  constructor () {
    this.core = new k8s.Core(k8s.config.fromKubeconfig())
    this.events = new EventEmitter()
  }

  spawnGameInstance (id) {
    const instance = Object.assign({}, pod)
    const name = instance.metadata.name + '-' + id

    instance.metadata.name = name

    this.core.namespaces.pods.post({body: instance}, () => {})

    const readinessInterval = setInterval(() => {
      this.core.ns.pods(name).get((err, res) => {
        const conds = res.status.conditions || []
        const readinessCond = conds.length
          ? conds.find(c => c.type === 'Ready')
          : null
        const ready = readinessCond
          ? readinessCond.status === 'True'
          : false

        if (ready) {
          this.events.emit('instance-ready', id)
          clearInterval(readinessInterval)
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
