const mongoose = require('mongoose');

const cedulaPendienteSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  apellidos: String,
  nombres: String,
  nacionalidad: String,
  sexo: String,
  creadoEn: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CedulaPendiente', cedulaPendienteSchema);
