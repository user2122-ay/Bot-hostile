const { SlashCommandBuilder } = require('discord.js');
const { establecerIconoMoneda } = require('../utils/economia');
const { esAdminEconomia } = require('../utils/permisos');
const { enviarLogEconomia } = require('../utils/economiaLogs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('icon-economy')
    .setDescription('Cambiar el emoji de la moneda del servidor (staff economía)')
    .addStringOption((opt) => opt.setName('emoji').setDescription('Emoji de teclado (🪙) o emoji del server').setRequired(true)),

  async execute(interaction) {
    if (!esAdminEconomia(interaction)) {
      await interaction.reply({ content: '❌ No tenés permiso para usar este comando.', ephemeral: true });
      return;
    }

    const emojiTexto = interaction.options.getString('emoji');
    await establecerIconoMoneda(emojiTexto);

    await interaction.reply({ content: `🎨 El emoji de la moneda ahora es: ${emojiTexto}`, ephemeral: true });

    await enviarLogEconomia(interaction.client, '🎨 Emoji de moneda cambiado', `**Staff:** ${interaction.user}\n**Nuevo emoji:** ${emojiTexto}`);
  },
};
