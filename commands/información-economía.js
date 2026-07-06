const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const Sueldo = require('../models/Sueldo');
const { obtenerIconoMoneda } = require('../utils/economia');
const { formatearIntervalo } = require('../utils/tiempo');

const COLOR_ECONOMIA = 0x27ae60;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('información-economía')
    .setDescription('Ver todos los roles con sueldo configurado'),

  async execute(interaction) {
    const sueldos = await Sueldo.find().sort({ monto: -1 });
    const icono = await obtenerIconoMoneda();

    let contenido;
    if (sueldos.length === 0) {
      contenido = `## 📊 Sueldos configurados\nTodavía no hay ningún rol con sueldo.`;
    } else {
      const lista = sueldos
        .map((s) => {
          const rol = interaction.guild.roles.cache.get(s.roleId);
          const nombreRol = rol ? rol : `\`${s.roleId}\` (rol eliminado)`;
          return `• ${nombreRol} — **${s.monto.toLocaleString('es-CO')}** ${icono} cada ${formatearIntervalo(s.intervaloMinutos || 60)}`;
        })
        .join('\n');
      contenido = `## 📊 Sueldos configurados\n${lista}`;
    }

    const container = new ContainerBuilder().setAccentColor(COLOR_ECONOMIA).addTextDisplayComponents((td) => td.setContent(contenido));

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
