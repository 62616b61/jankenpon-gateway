require('dotenv').config()

// for further usage
const devConfig = {}

const testConfig = {}

const prodConfig = {}

const defaultConfig = {
  PLAYER_SOCKET_PORT: process.env.PLAYER_SOCKET_PORT || 3030
}

function envConfig (env) {
  switch (env) {
    case 'development':
      return devConfig
    case 'test':
      return testConfig
    default:
      return prodConfig
  }
}

module.exports = {
  ...defaultConfig,
  ...envConfig(process.env.NODE_ENV)
}
