const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');
const { CASINO } = require('../utils/economiaConfig');

const COLOR_CASINO = 0x8e44ad;
const MULTIPLICADORES = { rojo: 2, negro: 2, verde: 14 };

function girarRuleta() {
  const numero = Math.floor(Math.random() * 37); // 0 a 36
  const color = numero === 0 ? 'verde' : numero % 2 === 0 ? 'negro' : 'rojo';
  return { numero, color };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ruleta')
    .setDescription('Apostar a un color en la ruleta')
    .addStringOption((opt) =>
      opt
        .setName('color')
        .setDescription('A qué color apostás')
        .setRequired(true)
        .addChoices(
          { name: 'Rojo', value: 'rojo' },
          { name: 'Negro', value: 'negro' },
          { name: 'Verde (paga más, sale poco)', value: 'verde' },
        ),
    )
    .addIntegerOption((opt) =>
      opt.setName('apuesta').setDescription(`Cuánto apostás (mín ${CASINO.apuestaMinima})`).setRequired(true).setMinValue(CASINO.apuestaMinima),
    ),

  async execute(interaction) {
    const colorElegido = interaction.options.getString('color');
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

    const { numero, color } = girarRuleta();
    const gano = color === colorElegido;
    const premio = gano ? apuesta * MULTIPLICADORES[colorElegido] : 0;

    usuario.cartera -= apuesta;
    if (gano) usuario.cartera += premio;
    await usuario.save();

    const emojiColor = { rojo: '🔴', negro: '⚫', verde: '🟢' };

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_CASINO)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `## 🎡 Ruleta\n\nSalió: ${emojiColor[color]} **${numero}** (${color})\nApostaste a: ${emojiColor[colorElegido]} ${colorElegido}\n\n` +
            (gano
              ? `🎉 **¡Ganaste ${premio.toLocaleString('es-CO')} ${icono}!**`
              : `💀 Perdiste ${apuesta.toLocaleString('es-CO')} ${icono}.`) +
            `\n\n**Cartera actual:** ${usuario.cartera.toLocaleString('es-CO')} ${icono}`,
        ),
      );

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
