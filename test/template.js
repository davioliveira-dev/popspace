require("../src/globals")
const fs = require("fs")

class Template {
  constructor() {
    this.certificate = fs.readFileSync(process.env.SSL_CERTIFICATE_PATH, 'utf8')
  }

  testServerClients(nClients, lambda, heartbeatTimeoutMillis) {
    return this.withLib(async () => {
      let result = null
      const { clients, hermes } = await lib.test.util.serverWithClients(nClients, heartbeatTimeoutMillis)
      try {
        result = await lambda(clients, hermes)
      } catch(e) {
        throw(e)
      } finally {
        await hermes.stop()
      }
      return result
    })
  }
  authenticatedActor(lambda) {
    return lib.test.template.testServerClients(1, async (clients, hermes) => {
      const testEnvironment = new lib.test.TestEnvironment()
      const client = clients[0]
      const environmentActor = await testEnvironment.createLoggedInActor(client)
      await testEnvironment.authenticate(environmentActor)
      testEnvironment.setHermes(hermes)
      return await lambda(testEnvironment, hermes)
    })
  }

  nAuthenticatedActors(nActors, lambda) {
    return lib.test.template.authenticatedActor(async (testEnvironment) => {
      const firstClient = testEnvironment.loggedInActors[0].client
      const room = testEnvironment.loggedInActors[0].room

      /*
        Each actor after the first one produces a certain number of join events.
        The number of events is equal to the amount of actors connected before him.
        Total events: 1 + 2 + 3 + 4 + 5 + ... + (nActors - 1)
        We go up to (nActors - 1), because we don't count the first actor.
      */
      let joinsRemaining = nActors * (nActors - 1)/2 - 1

      const clients = await lib.test.util.addClients(testEnvironment.hermes, nActors - 1)
      const joinsPropagatedPromise = new Promise(async (resolve, reject) => {
        [firstClient, ...clients].forEach((client) => {
          client.on('event.participantJoined', (event) => {
            joinsRemaining--
            if(joinsRemaining <= 0) {
              resolve()
            }
          })
        })
        if(joinsRemaining <= 0) {
          resolve()
        }
      })

      const inits = clients.map(async (client) => {
        const environmentActor = await testEnvironment.createLoggedInActor(client, room)
        await testEnvironment.authenticate(environmentActor)
      })
      await Promise.all(inits)
      await joinsPropagatedPromise
      return await lambda(testEnvironment)
    })

  }

  async httpClient() {
    const host = lib.appInfo.apiHost()
    const port = lib.appInfo.apiPort()
    const client = await shared.test.clients.HttpClient.anyLoggedInOrCreate(host, this.certificate, port)
    return client
  }

  withLib(lambda) {
    return async (params) => {
      await lib.init()
      const result = await lambda(params)
      await lib.cleanup()
      return result
    }
  }
}

module.exports = new Template()
