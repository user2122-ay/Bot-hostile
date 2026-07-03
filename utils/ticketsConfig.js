const DEPARTAMENTOS = {
  fundacion: {
    label: 'Fundación',
    roleId: '1396174893892243660',
    emojiId: '1449546324906082314',
    emojiName: 'owner',
    color: 0xf1c40f,
  },
  asuntos_internos: {
    label: 'Asuntos Internos',
    roleId: '1396174902465396827',
    emojiId: '1458867618382352395',
    emojiName: 'AI2',
    color: 0xc0392b,
  },
  administracion: {
    label: 'Administración',
    roleId: '1396174907234193408',
    emojiId: '1458868143102497024',
    emojiName: 'ADMIN2',
    color: 0xe67e22,
  },
  moderacion: {
    label: 'Moderación',
    roleId: '1396174915098513499',
    emojiId: '1458868676873687135',
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

// ¿Este member tiene el rol del departamento de ESE ticket? (para Reclamar)
function esStaffDelDepartamento(member, dep) {
  return member.roles.cache.has(dep.roleId);
}

// ¿Este member es staff de CUALQUIER departamento? (para "algún otro staff" al Cerrar)
function esStaffDeAlgunDepartamento(member) {
  return Object.values(DEPARTAMENTOS).some((dep) => member.roles.cache.has(dep.roleId));
}

module.exports = {
  DEPARTAMENTOS,
  CANAL_PANEL_ID,
  CANAL_REGISTROS_ID,
  emojiMencion,
  emojiSelect,
  esStaffDelDepartamento,
  esStaffDeAlgunDepartamento,
};
