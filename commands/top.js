const { SlashCommandBuilder, ContainerBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const Usuario = require('../models/Usuario');
const { formatearMoneda } = require('../utils/economiaCore');

const COLOR_ECONOMIA = 0x27ae60;
const MEDALLAS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder().setName('top').setDescription('Top 10 usuarios más ricos (cartera + banco)'),

  async execute(interaction) {
    await interaction.deferReply();

    const usuarios = await Usuario.find();
    if (usuarios.length === 0) {
      await interaction.editReply({ content: 'Todavía no hay nadie con dinero registrado.' });
      return;
    }

    const ordenados = usuarios
      .map((u) => ({ userId: u.userId, total: u.cartera + u.banco }))
      .sort((a, b) => b.total - a.total);

    const top10 = ordenados.slice(0, 10);
    const totalEconomia = ordenados.reduce((acc, u) => acc + u.total, 0);

    // Resolvemos nombre + avatar de cada usuario, pero como texto plano:
    // sin usar <@id> no se genera mención, notificación ni link a nadie.
    const perfiles = await Promise.all(
      top10.map(async (u) => {
        try {
          const user = await interaction.client.users.fetch(u.userId);
          return { ...u, nombre: user.globalName || user.username, avatar: user.displayAvatarURL() };
        } catch {
          return { ...u, nombre: 'Usuario desconocido', avatar: null };
        }
      }),
    );

    const [lider, ...resto] = perfiles;
    const liderTexto = await formatearMoneda(lider.total);
    const totalEconomiaTexto = await formatearMoneda(totalEconomia);

    const lineasResto = await Promise.all(
      resto.map(async (u, i) => {
        const posicion = i + 2;
        const medalla = MEDALLAS[posicion - 1] ?? `**${posicion}.**`;
        const monto = await formatearMoneda(u.total);
        return `${medalla} ${u.nombre} — ${monto}`;
      }),
    );

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_ECONOMIA)
      .addSectionComponents((section) =>
        section
          .addTextDisplayComponents((td) =>
            td.setContent(`## 🏆 Top 10 más ricos\n${MEDALLAS[0]} **${lider.nombre}** — ${liderTexto}`),
          )
          .setThumbnailAccessory((thumb) => thumb.setURL(lider.avatar ?? interaction.client.user.displayAvatarURL())),
      )
      .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents((td) => td.setContent(lineasResto.join('\n') || '-# Nadie más todavía.'))
      .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents((td) => td.setContent(`-# 💼 Economía total del servidor: ${totalEconomiaTexto}`));

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
