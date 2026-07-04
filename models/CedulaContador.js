const mongoose = require('mongoose');

const cedulaContadorSchema = new mongoose.Schema({
  clave: { type: String, required: true, unique: true, default: 'nirp' },
  contador: { type: Number, default: 0 },
});

module.exports = mongoose.model('CedulaContador', cedulaContadorSchema);
