const DEPARTAMENTOS = {
  fundacion: {
    label: 'Fundación',
    roleId: '1396174893892243660',
    emojiId: 'PON_AQUI_EL_ID',
    emojiName: 'owner',
    color: 0xf1c40f,
  },
  asuntos_internos: {
    label: 'Asuntos Internos',
    roleId: '1396174902465396827',
    emojiId: 'PON_AQUI_EL_ID',
    emojiName: 'AI2',
    color: 0xc0392b,
  },
  administracion: {
    label: 'Administración',
    roleId: '1396174907234193408',
    emojiId: 'PON_AQUI_EL_ID',
    emojiName: 'ADMIN2',
    color: 0xe67e22,
  },
  moderacion: {
    label: 'Moderación',
    roleId: '1396174915098513499',
    emojiId: 'PON_AQUI_EL_ID',
    emojiName: 'MOD',
    color: 0x3498db,
  },
};

const CANAL_PANEL_ID = '1396617856275320863';
const CANAL_REGISTROS_ID = '1522563718389436516';

// Para mostrar el emoji dentro de texto normal (mensajes, títulos).
function emojiMencion(dep) {
  return `<:${dep.emojiName}:${dep.emojiId}>`;
}

// Para el campo "emoji" de opciones de select menu/botones — discord.js pide objeto, no texto.
function emojiSelect(dep) {
  return { id: dep.emojiId, name: dep.emojiName };
}

module.exports = { DEPARTAMENTOS, CANAL_PANEL_ID, CANAL_REGISTROS_ID, emojiMencion, emojiSelect };
