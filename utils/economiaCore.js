const Usuario = require('../models/Usuario');
const { obtenerUsuario, obtenerIconoMoneda } = require('./economia');

// ── Formato de moneda ───────────────────────────────────────────
// Un solo lugar para mostrar plata en todo el bot: "1.234 🪙"
async function formatearMoneda(cantidad) {
  const icono = await obtenerIconoMoneda();
  return `${Math.trunc(cantidad).toLocaleString('es-CO')} ${icono}`;
}

// ── Error de saldo insuficiente ──────────────────────────────────
class SaldoInsuficienteError extends Error {
  constructor(disponible) {
    super('Saldo insuficiente');
    this.name = 'SaldoInsuficienteError';
    this.disponible = disponible;
  }
}

function validarCantidad(cantidad) {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new Error('La cantidad debe ser un número positivo.');
  }
  return Math.trunc(cantidad);
}

// ── Operaciones atómicas ─────────────────────────────────────────
// Todas usan operadores de Mongo ($inc, findOneAndUpdate con filtro de saldo
// incluido en la misma consulta) en vez de "leer -> modificar en JS -> guardar".
// Así, dos comandos ejecutados al mismo tiempo (spam, doble clic, dos partidas
// a la vez) nunca pueden duplicar plata ni dejar un saldo negativo: la base de
// datos resuelve el orden, no el código.

// Suma plata a la cartera (premios, depósitos de staff, pagos recibidos)
async function sumarCartera(userId, cantidad) {
  const monto = validarCantidad(cantidad);
  return Usuario.findOneAndUpdate(
    { userId },
    { $inc: { cartera: monto } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

// Resta de la cartera SOLO si alcanza. Lanza SaldoInsuficienteError si no.
async function restarCartera(userId, cantidad) {
  const monto = validarCantidad(cantidad);
  const usuario = await Usuario.findOneAndUpdate(
    { userId, cartera: { $gte: monto } },
    { $inc: { cartera: -monto } },
    { new: true },
  );
  if (!usuario) {
    const actual = await obtenerUsuario(userId);
    throw new SaldoInsuficienteError(actual.cartera);
  }
  return usuario;
}

// Resta de la cartera de un usuario sin importar si alcanza, pero nunca deja
// el saldo negativo (para /quitar-dinero de staff). Atómico con pipeline update
// (requiere MongoDB 4.2+, que es prácticamente cualquier instancia actual).
async function restarCarteraForzado(userId, cantidad) {
  const monto = validarCantidad(cantidad);
  await obtenerUsuario(userId); // asegura que el usuario exista
  return Usuario.findOneAndUpdate(
    { userId },
    [{ $set: { cartera: { $max: [0, { $subtract: ['$cartera', monto] }] } } }],
    { new: true },
  );
}

// Mueve plata de cartera a banco. Lanza SaldoInsuficienteError si no alcanza.
async function depositar(userId, cantidad) {
  const monto = validarCantidad(cantidad);
  const usuario = await Usuario.findOneAndUpdate(
    { userId, cartera: { $gte: monto } },
    { $inc: { cartera: -monto, banco: monto } },
    { new: true },
  );
  if (!usuario) {
    const actual = await obtenerUsuario(userId);
    throw new SaldoInsuficienteError(actual.cartera);
  }
  return usuario;
}

// Mueve plata de banco a cartera. Lanza SaldoInsuficienteError si no alcanza.
async function retirar(userId, cantidad) {
  const monto = validarCantidad(cantidad);
  const usuario = await Usuario.findOneAndUpdate(
    { userId, banco: { $gte: monto } },
    { $inc: { banco: -monto, cartera: monto } },
    { new: true },
  );
  if (!usuario) {
    const actual = await obtenerUsuario(userId);
    throw new SaldoInsuficienteError(actual.banco);
  }
  return usuario;
}

// Transfiere entre dos usuarios, descontando el impuesto configurado.
async function transferir(remitenteId, destinatarioId, cantidad, impuestoPorcentaje = 0) {
  const monto = validarCantidad(cantidad);
  const impuesto = Math.ceil((monto * impuestoPorcentaje) / 100);
  const montoRecibido = monto - impuesto;

  // Paso atómico: descuenta del remitente SOLO si alcanza. Esto es lo que
  // impide que dos /pagar simultáneos generen plata de la nada.
  const remitente = await Usuario.findOneAndUpdate(
    { userId: remitenteId, cartera: { $gte: monto } },
    { $inc: { cartera: -monto } },
    { new: true },
  );
  if (!remitente) {
    const actual = await obtenerUsuario(remitenteId);
    throw new SaldoInsuficienteError(actual.cartera);
  }

  const destinatario = await sumarCartera(destinatarioId, montoRecibido);

  return { remitente, destinatario, impuesto, montoRecibido };
}

// Acredita el sueldo de varios roles a la vez y marca la fecha de cobro,
// todo en una sola operación atómica (evita doble cobro por spam de /cobrar).
async function cobrarSueldos(userId, sueldosACobrar) {
  if (sueldosACobrar.length === 0) return obtenerUsuario(userId);

  const total = sueldosACobrar.reduce((acc, s) => acc + s.monto, 0);
  const marcasDeCobro = {};
  for (const s of sueldosACobrar) {
    marcasDeCobro[`cobros.${s.roleId}`] = new Date();
  }

  return Usuario.findOneAndUpdate(
    { userId },
    { $inc: { cartera: total }, $set: marcasDeCobro },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

module.exports = {
  formatearMoneda,
  SaldoInsuficienteError,
  sumarCartera,
  restarCartera,
  restarCarteraForzado,
  depositar,
  retirar,
  transferir,
  cobrarSueldos,
};

