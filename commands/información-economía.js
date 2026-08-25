const { SlashCommandBuilder, ContainerBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const Sueldo = require('../models/Sueldo');
const { formatearMoneda } = require('../utils/economiaCore');
const { formatearIntervalo } = require('../utils/tiempo');

const COLOR_ECONOMIA = 0x27ae60;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('información-economía')
    .setDescription('Ver todos los roles con sueldo configurado'),

  async execute(interaction) {
    await interaction.deferReply();

    const sueldos = await Sueldo.find().sort({ monto: -1 });

    if (sueldos.length === 0) {
      const container = new ContainerBuilder()
        .setAccentColor(COLOR_ECONOMIA)
        .addTextDisplayComponents((td) => td.setContent('## 📊 Sueldos configurados\nTodavía no hay ningún rol con sueldo.'));
      await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
      return;
    }

    // Mostramos el nombre del rol como texto plano (rol.name), no como mención:
    // así no se resalta ni notifica a nadie que tenga ese rol.
    const lineas = await Promise.all(
      sueldos.map(async (s) => {
        const rol = interaction.guild.roles.cache.get(s.roleId);
        const nombreRol = rol ? rol.name : `Rol eliminado (${s.roleId})`;
        const montoTexto = await formatearMoneda(s.monto);
        return `💰 **${nombreRol}** — ${montoTexto} cada ${formatearIntervalo(s.intervaloMinutos || 60)}`;
      }),
    );

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_ECONOMIA)
      .addTextDisplayComponents((td) => td.setContent('## 📊 Sueldos configurados'))
      .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents((td) => td.setContent(lineas.join('\n')))
      .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
      .addTextDisplayComponents((td) =>
        td.setContent(`-# ${sueldos.length} rol${sueldos.length === 1 ? '' : 'es'} con sueldo configurado`),
      );

    await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
