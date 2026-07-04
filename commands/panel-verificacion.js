const { SlashCommandBuilder, ContainerBuilder, SeparatorSpacingSize, ButtonBuilder, ButtonStyle, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { CANAL_PANEL_VERIFICACION_ID } = require('../utils/verificacionConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel-verificacion')
    .setDescription('Publica el panel de verificación de Roblox')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const canal = await client.channels.fetch(CANAL_PANEL_VERIFICACION_ID);

    const container = new ContainerBuilder()
      .setAccentColor(0x1f3a5f)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `# ✅ Verificación — Medellín Roleplay\n` +
            `Para entrar al server necesitás verificar tu cuenta de Roblox:\n\n` +
            `**1.** Tocá **Verificarse**.\n` +
            `**2.** Escribí tu usuario de Roblox.\n` +
            `**3.** Confirmá que esa cuenta es tuya (te mostramos tu avatar).\n` +
            `**4.** Respondé 8 preguntas cortas sobre roleplay.\n` +
            `**5.** El staff revisa tu formulario y te avisa por mensaje directo.`,
        ),
      )
      .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents((row) =>
        row.setComponents(new ButtonBuilder().setCustomId('verificacion_iniciar').setLabel('Verificarse').setStyle(ButtonStyle.Success)),
      );

    await canal.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    await interaction.reply({ content: '✅ Panel de verificación publicado.', ephemeral: true });
  },
};
