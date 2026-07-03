const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const Sueldo = require('../models/Sueldo');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');

const COLOR_ECONOMIA = 0x27ae60;
const COOLDOWN_MS = 1000 * 60 * 60; // 1 hora entre cobros, ajustable acá

module.exports = {
  data: new SlashCommandBuilder().setName('cobrar').setDescription('Cobrar el sueldo de tus roles'),

  async execute(interaction) {
    const usuario = await obtenerUsuario(interaction.user.id);
    const ahora = Date.now();
    const ultimo = usuario.ultimoCobro ? usuario.ultimoCobro.getTime() : 0;

    if (ahora - ultimo < COOLDOWN_MS) {
      const restanteMin = Math.ceil((COOLDOWN_MS - (ahora - ultimo)) / 60000);
      await interaction.reply({
        content: `⏳ Ya cobraste. Podés volver a cobrar en ${restanteMin} minuto(s).`,
        ephemeral: true,
      });
      return;
    }

    const rolesUsuario = interaction.member.roles.cache.map((r) => r.id);
    const sueldos = await Sueldo.find({ roleId: { $in: rolesUsuario } });

    if (sueldos.length === 0) {
      await interaction.reply({
        content: '❌ Ninguno de tus roles tiene un sueldo configurado.',
        ephemeral: true,
      });
      return;
    }

    const total = sueldos.reduce((acc, s) => acc + s.monto, 0);
    usuario.cartera += total;
    usuario.ultimoCobro = new Date();
    await usuario.save();

    const icono = await obtenerIconoMoneda();
    const detalle = sueldos
      .map((s) => {
        const rol = interaction.guild.roles.cache.get(s.roleId);
        return `• ${rol ? rol.name : s.roleId}: ${s.monto.toLocaleString('es-CO')} ${icono}`;
      })
      .join('\n');

    const container = new ContainerBuilder().setAccentColor(COLOR_ECONOMIA).addTextDisplayComponents((td) =>
      td.setContent(
        `## ${icono} Sueldo cobrado\n${detalle}\n\n**Total:** ${total.toLocaleString('es-CO')} ${icono}\nSe agregó a tu cartera.`,
      ),
    );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
