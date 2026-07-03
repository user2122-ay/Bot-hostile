const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  canalId: { type: String, required: true, unique: true },
  usuarioId: { type: String, required: true },
  departamento: { type: String, required: true },
  numero: { type: Number, required: true },
  abierto: { type: Boolean, default: true },
  creadoEn: { type: Date, default: Date.now },
  cerradoEn: { type: Date, default: null },
});

module.exports = mongoose.model('Ticket', ticketSchema);
