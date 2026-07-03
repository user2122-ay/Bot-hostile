const TicketContador = require('../models/TicketContador');

// Devuelve el siguiente número de ticket para ese departamento y lo guarda en Mongo (no se pierde con reinicios).
async function siguienteNumero(departamento) {
  const doc = await TicketContador.findOneAndUpdate(
    { departamento },
    { $inc: { contador: 1 } },
    { upsert: true, new: true },
  );
  return doc.contador;
}

async function contadoresActuales() {
  return TicketContador.find();
}

module.exports = { siguienteNumero, contadoresActuales };
