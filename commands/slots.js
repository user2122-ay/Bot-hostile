const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');
const { CASINO } = require('../utils/economiaConfig');

const COLOR_CASINO = 0x8e44ad;
const SIMBOLOS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
const MULTIPLICADORES = { '🍒': 2, '🍋': 3, '🍇': 4, '🔔': 6, '💎': 10, '7️⃣': 20 };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Jugar a la tragamonedas')
    .addIntegerOption((opt) =>
      opt.setName('apuesta').setDescription(`Cuánto apostás (mín ${CASINO.apuestaMinima})`).setRequired(true).setMinValue(CASINO.apuestaMinima),
    ),

  async execute(interaction) {
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

    const resultado = [0, 0, 0].map(() => SIMBOLOS[Math.floor(Math.random() * SIMBOLOS.length)]);
    const gano = resultado[0] === resultado[1] && resultado[1] === resultado[2];
    const premio = gano ? apuesta * MULTIPLICADORES[resultado[0]] : 0;

    usuario.cartera -= apuesta;
    if (gano) usuario.cartera += premio;
    await usuario.save();

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_CASINO)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `## 🎰 Tragamonedas\n\n# ${resultado.join(' | ')}\n\n` +
            (gano
              ? `🎉 **¡Ganaste ${premio.toLocaleString('es-CO')} ${icono}!**`
              : `💀 Perdiste ${apuesta.toLocaleString('es-CO')} ${icono}. Suerte para la próxima.`) +
            `\n\n**Cartera actual:** ${usuario.cartera.toLocaleString('es-CO')} ${icono}`,
        ),
      );

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
