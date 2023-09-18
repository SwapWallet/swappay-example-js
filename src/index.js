const bot = require('./bot')
const db = require('./utils/db')

async function main() {
  await db.connectToDB()
  await bot.start()
}

main()