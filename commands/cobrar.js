const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const Sueldo = require('../models/Sueldo');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');

const COLOR_ECONOMIA = 0x27ae60;

module.exports = {
  data: new SlashCommandBuilder().setName('cobrar').setDescription('Cobrar el sueldo de tus roles'),

  async execute(interaction) {
    const usuario = await obtenerUsuario(interaction.user.id);
    const icono = await obtenerIconoMoneda();

    const rolesUsuario = interaction.member.roles.cache.map((r) => r.id);
    const sueldos = await Sueldo.find({ roleId: { $in: rolesUsuario } });

    if (sueldos.length === 0) {
      await interaction.reply({ content: '❌ Ninguno de tus roles tiene un sueldo configurado.', ephemeral: true });
      return;
    }

    const ahora = Date.now();
    let total = 0;
    const cobrados = [];
    const enEspera = [];

    for (const sueldo of sueldos) {
      const ultimo = usuario.cobros.get(sueldo.roleId);
      const intervaloMs = (sueldo.intervaloMinutos || 60) * 60 * 1000;
      const listo = !ultimo || ahora - ultimo.getTime() >= intervaloMs;

      const rol = interaction.guild.roles.cache.get(sueldo.roleId);
      const nombreRol = rol ? rol.name : sueldo.roleId;

      if (listo) {
        total += sueldo.monto;
        usuario.cobros.set(sueldo.roleId, new Date());
        cobrados.push(`• ${nombreRol}: +${sueldo.monto.toLocaleString('es-CO')} ${icono}`);
      } else {
        const restanteMin = Math.ceil((intervaloMs - (ahora - ultimo.getTime())) / 60000);
        enEspera.push(`• ${nombreRol}: disponible en ${restanteMin} min`);
      }
    }

    if (total === 0) {
      await interaction.reply({
        content: `⏳ Todavía no podés cobrar nada, están en espera:\n${enEspera.join('\n')}`,
        ephemeral: true,
      });
      return;
    }

    usuario.markModified('cobros');
    usuario.cartera += total;
    await usuario.save();

    let contenido = `## 💰 Sueldo cobrado\n${cobrados.join('\n')}\n\n**Total:** +${total.toLocaleString('es-CO')} ${icono}`;
    if (enEspera.length > 0) {
      contenido += `\n\n**Todavía en espera:**\n${enEspera.join('\n')}`;
    }

    const container = new ContainerBuilder().setAccentColor(COLOR_ECONOMIA).addTextDisplayComponents((td) => td.setContent(contenido));

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
