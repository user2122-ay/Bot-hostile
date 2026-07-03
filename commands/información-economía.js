const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const Sueldo = require('../models/Sueldo');
const { obtenerIconoMoneda } = require('../utils/economia');
const { esAdminEconomia } = require('../utils/permisos');

const COLOR_ECONOMIA = 0x27ae60;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('información-economía')
    .setDescription('Ver todos los roles con sueldo configurado (staff economía)'),

  async execute(interaction) {
    if (!esAdminEconomia(interaction)) {
      await interaction.reply({ content: '❌ No tenés permiso para usar este comando.', ephemeral: true });
      return;
    }

    const sueldos = await Sueldo.find().sort({ monto: -1 });
    const icono = await obtenerIconoMoneda();

    let contenido;
    if (sueldos.length === 0) {
      contenido = `## ${icono} Sueldos configurados\nTodavía no hay ningún rol con sueldo. Usá /añadir-sueldo.`;
    } else {
      const lista = sueldos
        .map((s) => {
          const rol = interaction.guild.roles.cache.get(s.roleId);
          return `• ${rol ? rol : `\`${s.roleId}\` (rol eliminado)`} — **${s.monto.toLocaleString('es-CO')}** ${icono}`;
        })
        .join('\n');
      contenido = `## ${icono} Sueldos configurados\n${lista}`;
    }

    const container = new ContainerBuilder().setAccentColor(COLOR_ECONOMIA).addTextDisplayComponents((td) =>
      td.setContent(contenido),
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
