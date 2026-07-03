const ROLE_ADMIN_ECONOMIA = '1522395962138558545';

function esAdminEconomia(interaction) {
  return interaction.member.roles.cache.has(ROLE_ADMIN_ECONOMIA);
}

module.exports = { ROLE_ADMIN_ECONOMIA, esAdminEconomia };
