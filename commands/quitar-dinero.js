const { SlashCommandBuilder } = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');
const { esAdminEconomia } = require('../utils/permisos');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quitar-dinero')
    .setDescription('Quitar dinero de la cartera de un usuario (staff economía)')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuario a modificar').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('cantidad').setDescription('Cantidad a quitar').setRequired(true).setMinValue(1),
    ),

  async execute(interaction) {
    if (!esAdminEconomia(interaction)) {
      await interaction.reply({ content: '❌ No tenés permiso para usar este comando.', ephemeral: true });
      return;
    }

    const objetivo = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cantidad');

    const usuario = await obtenerUsuario(objetivo.id);
    usuario.cartera = Math.max(0, usuario.cartera - cantidad);
    await usuario.save();

    const icono = await obtenerIconoMoneda();
    await interaction.reply({
      content: `✅ Se quitaron ${cantidad.toLocaleString('es-CO')} ${icono} de la cartera de ${objetivo}. Nuevo balance: ${usuario.cartera.toLocaleString('es-CO')} ${icono}`,
      ephemeral: true,
    });
  },
};
