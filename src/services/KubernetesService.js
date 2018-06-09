const { RUNTIME } = require('../config/constants')
const podDef = require('../config/game-instance-pod.json')
const serviceDef = require('../config/game-instance-service.json')

//const KubernetesClient = require('kubernetes-client').Client
//const KubernetesConfig = require('kubernetes-client').confi
const EventEmitter = require('events')

class KubernetesService {
  constructor () {
    this.events = new EventEmitter()
    //this.k8s = new KubernetesClient({ config: KubernetesConfig.getInCluster() });
    this.rooms = 0

    //await this.client.loadSpec();
  }

  spawnGameInstance (player1, player2) {
    console.log('SPAWN GAME INSTANCE')

    const id = this.rooms++

    const pod = JSON.parse(JSON.stringify(podDef))
    pod.metadata.name = pod.metadata.name + '-' + id
    pod.metadata.labels.room = String(id)
    //this.k8s.namespaces.pods.post({body: pod}, (a, b) => {
      //console.log('POD SPAWN', a, b)
    //})

    const service = JSON.parse(JSON.stringify(serviceDef))
    service.metadata.name = service.metadata.name + '-' + id
    service.spec.selector.room = String(id)
    //this.k8s.namespaces.services.post({body: service}, (a, b) => {
      //console.log('SERVICE SPAWN', a, b)
    //})

    const port = "3001"
    this.events.emit('instance-ready', player1, player2, port)

    //const readinessInterval = setInterval(() => {
      //this.k8s.ns.pods.matchLabels({ room: id }).get((err, res) => {
        //if (err) throw err

        //const conds = res.items && res.items[0].status.conditions || []
        //const readinessCond = conds.length
          //? conds.find(c => c.type === 'Ready')
          //: null
        //const ready = readinessCond
          //? readinessCond.status === 'True'
          //: false

        //if (ready) {
          //clearInterval(readinessInterval)

          //const ip = res.items[0].status.podIP
          //this.events.emit('instance-ready', id, ip)
        //}
      //});
    //}, 1000)
  }

  on (event, callback) {
    const events = ['instance-ready']

    if (events.includes(event)) return this.events.on(event, callback)
    else throw new Error(`Attempting to subscribe to unknown event "${event}"`)
  }
}

module.exports = KubernetesService
