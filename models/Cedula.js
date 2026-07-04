const mongoose = require('mongoose');

const cedulaSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  nirp: { type: String, required: true },
  apellidos: { type: String, required: true },
  nombres: { type: String, required: true },
  nacionalidad: { type: String, required: true },
  sexo: { type: String, required: true },
  tipoSangre: { type: String, required: true },
  fechaNacimiento: { type: String, required: true },
  lugarNacimiento: { type: String, required: true },
  lugarExpedicion: { type: String, required: true },
  fechaExpedicion: { type: String, required: true },
  fotoUrl: { type: String, default: null },
  creadoEn: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cedula', cedulaSchema);
