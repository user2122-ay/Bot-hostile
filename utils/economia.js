const Usuario = require('../models/Usuario');
const Config = require('../models/Config');

async function obtenerUsuario(userId) {
  let usuario = await Usuario.findOne({ userId });
  if (!usuario) {
    try {
      usuario = await Usuario.create({ userId, cartera: 0, banco: 0 });
    } catch (err) {
      // Dos comandos crearon al mismo usuario nuevo en el mismo instante.
      if (err.code === 11000) {
        usuario = await Usuario.findOne({ userId });
      } else {
        throw err;
      }
    }
  }
  return usuario;
}

// El emoji de la moneda se guarda en caché en memoria para no pegarle a la
// base de datos cada vez que un comando necesita mostrar plata.
let iconoCache = null;

async function obtenerIconoMoneda() {
  if (iconoCache !== null) return iconoCache;
  const config = await Config.findOne({ clave: 'icono_moneda' });
  iconoCache = config ? config.valor : '🪙';
  return iconoCache;
}

async function establecerIconoMoneda(icono) {
  await Config.findOneAndUpdate({ clave: 'icono_moneda' }, { valor: icono }, { upsert: true });
  iconoCache = icono;
}

module.exports = { obtenerUsuario, obtenerIconoMoneda, establecerIconoMoneda };
