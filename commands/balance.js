const {
  SlashCommandBuilder,
  ContainerBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');

const COLOR_ECONOMIA = 0x27ae60;

module.exports = {
  data: new SlashCommandBuilder().setName('balance').setDescription('Mostrar tu cartera y banco'),

  async execute(interaction) {
    const usuario = await obtenerUsuario(interaction.user.id);
    const icono = await obtenerIconoMoneda();

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_ECONOMIA)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `## ${icono} Balance de ${interaction.user.username}\n` +
            `**Cartera:** ${usuario.cartera.toLocaleString('es-CO')} ${icono}\n` +
            `**Banco:** ${usuario.banco.toLocaleString('es-CO')} ${icono}`,
        ),
      )
      .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents((row) =>
        row.setComponents(
          new ButtonBuilder().setCustomId('economia_depositar').setLabel('Depositar').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('economia_retirar').setLabel('Retirar').setStyle(ButtonStyle.Danger),
        ),
      );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
