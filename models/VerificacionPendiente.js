const mongoose = require('mongoose');

const verificacionPendienteSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  robloxUsername: { type: String, required: true },
  robloxUserId: { type: String, required: true },
  avatarUrl: { type: String, default: null },
  respuestas: { type: [String], default: [] },
  creadoEn: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VerificacionPendiente', verificacionPendienteSchema);
