const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  cartera: { type: Number, default: 0 },
  banco: { type: Number, default: 0 },
  ultimoCobro: { type: Date, default: null },
});

module.exports = mongoose.model('Usuario', usuarioSchema);
