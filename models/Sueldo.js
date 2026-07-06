const mongoose = require('mongoose');

const sueldoSchema = new mongoose.Schema({
  roleId: { type: String, required: true, unique: true },
  monto: { type: Number, required: true },
  intervaloMinutos: { type: Number, required: true, default: 60 },
});

module.exports = mongoose.model('Sueldo', sueldoSchema);
