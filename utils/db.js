const mongoose = require('mongoose');

async function conectarMongo() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Falta la variable MONGODB_URI');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');
}

module.exports = { conectarMongo };
