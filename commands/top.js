const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const Usuario = require('../models/Usuario');
const { obtenerIconoMoneda } = require('../utils/economia');

const COLOR_ECONOMIA = 0x27ae60;

module.exports = {
  data: new SlashCommandBuilder().setName('top').setDescription('Top 10 usuarios más ricos (cartera + banco)'),

  async execute(interaction) {
    const usuarios = await Usuario.find();
    const icono = await obtenerIconoMoneda();

    const ordenados = usuarios
      .map((u) => ({ userId: u.userId, total: u.cartera + u.banco }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (ordenados.length === 0) {
      await interaction.reply({ content: 'Todavía no hay nadie con dinero registrado.', ephemeral: true });
      return;
    }

    const medallas = ['🥇', '🥈', '🥉'];
    const lista = ordenados
      .map((u, i) => `${medallas[i] ?? `**${i + 1}.**`} <@${u.userId}> — ${u.total.toLocaleString('es-CO')} ${icono}`)
      .join('\n');

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_ECONOMIA)
      .addTextDisplayComponents((td) => td.setContent(`## 🏆 Top 10 más ricos\n${lista}`));

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
