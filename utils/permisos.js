const ROLE_ADMIN_ECONOMIA = '1459290551517184186';

function esAdminEconomia(interaction) {
  return interaction.member.roles.cache.has(ROLE_ADMIN_ECONOMIA);
}

module.exports = { ROLE_ADMIN_ECONOMIA, esAdminEconomia };
