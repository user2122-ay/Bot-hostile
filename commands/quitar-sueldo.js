const { SlashCommandBuilder } = require('discord.js');
const Sueldo = require('../models/Sueldo');
const { esAdminEconomia } = require('../utils/permisos');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quitar-sueldo')
    .setDescription('Quitar el sueldo configurado de un rol (staff economía)')
    .addRoleOption((opt) => opt.setName('rol').setDescription('Rol a quitar').setRequired(true)),

  async execute(interaction) {
    if (!esAdminEconomia(interaction)) {
      await interaction.reply({ content: '❌ No tenés permiso para usar este comando.', ephemeral: true });
      return;
    }

    const rol = interaction.options.getRole('rol');
    const resultado = await Sueldo.findOneAndDelete({ roleId: rol.id });

    if (!resultado) {
      await interaction.reply({ content: `⚠️ El rol ${rol} no tenía sueldo configurado.`, ephemeral: true });
      return;
    }

    await interaction.reply({ content: `✅ Se quitó el sueldo del rol ${rol}.`, ephemeral: true });
  },
};
