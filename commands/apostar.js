const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');
const { CASINO } = require('../utils/economiaConfig');

const COLOR_CASINO = 0x8e44ad;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('apostar')
    .setDescription('Cara o cruz contra la casa')
    .addStringOption((opt) =>
      opt
        .setName('eleccion')
        .setDescription('Cara o cruz')
        .setRequired(true)
        .addChoices({ name: 'Cara', value: 'cara' }, { name: 'Cruz', value: 'cruz' }),
    )
    .addIntegerOption((opt) =>
      opt.setName('apuesta').setDescription(`Cuánto apostás (mín ${CASINO.apuestaMinima})`).setRequired(true).setMinValue(CASINO.apuestaMinima),
    ),

  async execute(interaction) {
    const eleccion = interaction.options.getString('eleccion');
    const apuesta = interaction.options.getInteger('apuesta');

    if (apuesta > CASINO.apuestaMaxima) {
      await interaction.reply({ content: `❌ La apuesta máxima es ${CASINO.apuestaMaxima.toLocaleString('es-CO')}.`, ephemeral: true });
      return;
    }

    const usuario = await obtenerUsuario(interaction.user.id);
    const icono = await obtenerIconoMoneda();

    if (usuario.cartera < apuesta) {
      await interaction.reply({
        content: `❌ No tenés suficiente en la cartera. Tenés ${usuario.cartera.toLocaleString('es-CO')} ${icono}.`,
        ephemeral: true,
      });
      return;
    }

    const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
    const gano = resultado === eleccion;
    const premio = gano ? apuesta * 2 : 0;

    usuario.cartera -= apuesta;
    if (gano) usuario.cartera += premio;
    await usuario.save();

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_CASINO)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `## 🪙 Cara o Cruz\n\nSalió: **${resultado === 'cara' ? '🙂 Cara' : '⚡ Cruz'}**\nElegiste: ${eleccion}\n\n` +
            (gano
              ? `🎉 **¡Ganaste ${premio.toLocaleString('es-CO')} ${icono}!**`
              : `💀 Perdiste ${apuesta.toLocaleString('es-CO')} ${icono}.`) +
            `\n\n**Cartera actual:** ${usuario.cartera.toLocaleString('es-CO')} ${icono}`,
        ),
      );

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
