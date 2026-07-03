const ROLE_ADMIN_ECONOMIA = '1522423168323813376';

function esAdminEconomia(interaction) {
  return interaction.member.roles.cache.has(ROLE_ADMIN_ECONOMIA);
}

module.exports = { ROLE_ADMIN_ECONOMIA, esAdminEconomia };
