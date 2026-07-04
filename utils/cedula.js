const CedulaContador = require('../models/CedulaContador');

async function siguienteNirp() {
  const doc = await CedulaContador.findOneAndUpdate(
    { clave: 'nirp' },
    { $inc: { contador: 1 } },
    { upsert: true, new: true },
  );
  return `MR-${String(doc.contador).padStart(6, '0')}`;
}

module.exports = { siguienteNirp };
