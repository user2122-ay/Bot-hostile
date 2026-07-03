const {
  SlashCommandBuilder,
  ContainerBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require('discord.js');
const { DEPARTAMENTOS, CANAL_PANEL_ID, emojiMencion, emojiSelect } = require('../utils/ticketsConfig');
const { contadoresActuales } = require('../utils/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel-tickets')
    .setDescription('Publica el panel de tickets en el canal configurado')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const canal = await client.channels.fetch(CANAL_PANEL_ID);
    const contadores = await contadoresActuales();
    const mapaContadores = Object.fromEntries(contadores.map((c) => [c.departamento, c.contador]));

    const opciones = Object.entries(DEPARTAMENTOS).map(([id, dep]) => ({
      label: dep.label,
      value: id,
      emoji: emojiSelect(dep),
    }));

    const container = new ContainerBuilder()
      .setAccentColor(0x1f3a5f)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `# 🎫 Centro de Soporte — Medellín Roleplay\n` +
            `¿Necesitás contactar a algún departamento? Elegí una opción abajo y se te va a crear un canal privado.`,
        ),
      )
      .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents((td) =>
        td.setContent(
          Object.entries(DEPARTAMENTOS)
            .map(([id, dep]) => `${emojiMencion(dep)} **${dep.label}** — ${mapaContadores[id] ?? 0} ticket(s) creados`)
            .join('\n'),
        ),
      )
      .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addActionRowComponents((row) =>
        row.setComponents(
          new StringSelectMenuBuilder()
            .setCustomId('ticket_categoria')
            .setPlaceholder('Elegí un departamento...')
            .addOptions(opciones),
        ),
      );

    await canal.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    await interaction.reply({ content: '✅ Panel de tickets publicado.', ephemeral: true });
  },
};
