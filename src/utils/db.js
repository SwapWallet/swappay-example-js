const mongoose = require('mongoose')
const config = require('../config')

async function connectToDB() {
  console.log('connecting to the database...')
  await mongoose.set('strictQuery', true);
  await mongoose.connect(config.db.uri)
  console.log('connected!')
}

module.exports = {
  connectToDB,
}
