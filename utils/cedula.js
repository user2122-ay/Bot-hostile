const Cedula = require('../models/Cedula');

function generarNirpAleatorio() {
  const numero = Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');
  return `${numero.slice(0, 3)}.${numero.slice(3, 6)}.${numero.slice(6, 9)}`;
}

async function siguienteNirp() {
  let nirp;
  let existe = true;
  let intentos = 0;
  while (existe && intentos < 15) {
    nirp = generarNirpAleatorio();
    existe = await Cedula.exists({ nirp });
    intentos++;
  }
  return nirp;
}

module.exports = { siguienteNirp };
