const Usuario = require('../models/Usuario');
const Config = require('../models/Config');

async function obtenerUsuario(userId) {
  let usuario = await Usuario.findOne({ userId });
  if (!usuario) {
    usuario = await Usuario.create({ userId, cartera: 0, banco: 0 });
  }
  return usuario;
}

async function obtenerIconoMoneda() {
  const config = await Config.findOne({ clave: 'icono_moneda' });
  return config ? config.valor : '🪙';
}

async function establecerIconoMoneda(icono) {
  await Config.findOneAndUpdate({ clave: 'icono_moneda' }, { valor: icono }, { upsert: true });
}

module.exports = { obtenerUsuario, obtenerIconoMoneda, establecerIconoMoneda };
