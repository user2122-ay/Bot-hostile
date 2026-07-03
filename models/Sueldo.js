const mongoose = require('mongoose');

const sueldoSchema = new mongoose.Schema({
  roleId: { type: String, required: true, unique: true },
  monto: { type: Number, required: true },
});

module.exports = mongoose.model('Sueldo', sueldoSchema);
