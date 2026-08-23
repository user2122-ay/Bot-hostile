const DEPARTAMENTOS = {
  fundacion: {
    label: 'Fundación',
    roleId: '1396174899306954903',
    emojiId: '1540790447738462288',
    emojiName: 'asociacion',
    color: 0xf1c40f,
  },
  Dirección: {
    label: 'Asuntos Internos',
    roleId: '1528573535440601178',
    emojiId: '1530964526219133018',
    emojiName: 'herramientas',
    color: 0xc0392b,
  },
  administracion: {
    label: 'Administración',
    roleId: '1528573203537068072',
    emojiId: '1530967352680910938',
    emojiName: 'martillo',
    color: 0xe67e22,
  },
  moderacion: {
    label: 'Moderación',
    roleId: '1528573112055234640',
    emojiId: '1540834802448736256',
    emojiName: 'miembro',
    color: 0x3498db,
  },
};

const CANAL_PANEL_ID = '1536880178167291904';
const CANAL_REGISTROS_ID = '1535465853879844944';

// Para mostrar el emoji dentro de texto normal (mensajes, títulos).
function emojiMencion(dep) {
  return `<:${dep.emojiName}:${dep.emojiId}>`;
}

// Para el campo "emoji" de opciones de select menu/botones — discord.js pide objeto, no texto.
function emojiSelect(dep) {
  return { id: dep.emojiId, name: dep.emojiName };
}
1
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
