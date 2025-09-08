require('dotenv').config()

let mongoUser = process.env.MONGO_USER
let mongoPass = process.env.MONGO_PASS
let mongoHost = process.env.MONGO_HOST
let mongoPort = process.env.MONGO_PORT
let mongoDb = process.env.MONGO_DB

const config = {
  telegram: {
    token: process.env.TELEGRAM_TOKEN,
  },
  swapPay: {
    apiKey: process.env.SWAP_PAY_API_KEY,
    application: process.env.SWAP_PAY_APPLICATION,
  },
  db: {
    uri: `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}/${mongoDb}?directConnection=true`
  },
}

module.exports = config
