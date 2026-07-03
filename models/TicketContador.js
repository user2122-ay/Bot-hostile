const mongoose = require('mongoose');

const contadorSchema = new mongoose.Schema({
  departamento: { type: String, required: true, unique: true },
  contador: { type: Number, default: 0 },
});

module.exports = mongoose.model('TicketContador', contadorSchema);
