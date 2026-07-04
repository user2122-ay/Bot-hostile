const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  cartera: { type: Number, default: 0 },
  banco: { type: Number, default: 0 },
  ultimoCobro: { type: Date, default: null },
  robloxUsername: { type: String, default: null },
  robloxUserId: { type: String, default: null },
  robloxAvatarUrl: { type: String, default: null },
});

module.exports = mongoose.model('Usuario', usuarioSchema);
