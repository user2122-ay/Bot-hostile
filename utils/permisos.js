// IDs de roles que pueden usar los comandos de staff de economía
// (añadir/quitar dinero, sueldos, cambiar el emoji de la moneda, etc).
// Para sumar otro rol con acceso, agregá su ID a este array.
const ROLES_ADMIN_ECONOMIA = ['1459290551517184186'];

function esAdminEconomia(interaction) {
  return interaction.member.roles.cache.some((rol) => ROLES_ADMIN_ECONOMIA.includes(rol.id));
}

module.exports = { ROLES_ADMIN_ECONOMIA, esAdminEconomia };
