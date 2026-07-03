const {
  SlashCommandBuilder,
  ContainerBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');
const { CASINO } = require('../utils/economiaConfig');

const COLOR_CASINO = 0x8e44ad;
const PALOS = ['♠️', '♥️', '♦️', '♣️'];
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function crearMazo() {
  const mazo = [];
  for (const palo of PALOS) {
    for (const valor of VALORES) mazo.push({ palo, valor });
  }
  for (let i = mazo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
  }
  return mazo;
}

function valorCarta(carta) {
  if (carta.valor === 'A') return 11;
  if (['J', 'Q', 'K'].includes(carta.valor)) return 10;
  return parseInt(carta.valor, 10);
}

function valorMano(mano) {
  let total = mano.reduce((acc, c) => acc + valorCarta(c), 0);
  let ases = mano.filter((c) => c.valor === 'A').length;
  while (total > 21 && ases > 0) {
    total -= 10;
    ases -= 1;
  }
  return total;
}

function formatearMano(mano) {
  return mano.map((c) => `${c.valor}${c.palo}`).join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Jugar blackjack contra la casa')
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

    usuario.cartera -= apuesta;
    await usuario.save();

    const mazo = crearMazo();
    const manoJugador = [mazo.pop(), mazo.pop()];
    const manoDealer = [mazo.pop(), mazo.pop()];

    function construirContainer({ terminado = false, resultado = null } = {}) {
      const dealerMostrado = terminado ? formatearMano(manoDealer) : `${manoDealer[0].valor}${manoDealer[0].palo} 🂠`;
      const dealerValor = terminado ? ` (${valorMano(manoDealer)})` : '';
      const textoResultado = terminado
        ? `\n\n${resultado.texto}\n\n**Cartera actual:** ${usuario.cartera.toLocaleString('es-CO')} ${icono}`
        : '';

      const container = new ContainerBuilder()
        .setAccentColor(COLOR_CASINO)
        .addTextDisplayComponents((td) =>
          td.setContent(
            `## 🃏 Blackjack\n\n**Dealer:** ${dealerMostrado}${dealerValor}\n**Vos:** ${formatearMano(manoJugador)} (${valorMano(manoJugador)})${textoResultado}`,
          ),
        );

      if (!terminado) {
        container
          .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
          .addActionRowComponents((row) =>
            row.setComponents(
              new ButtonBuilder().setCustomId('bj_hit').setLabel('Pedir carta').setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId('bj_stand').setLabel('Plantarse').setStyle(ButtonStyle.Secondary),
            ),
          );
      }

      return container;
    }

    if (valorMano(manoJugador) === 21) {
      const premio = Math.floor(apuesta * 2.5);
      usuario.cartera += premio;
      await usuario.save();
      await interaction.reply({
        components: [construirContainer({ terminado: true, resultado: { texto: `🎉 **¡Blackjack! Ganaste ${premio.toLocaleString('es-CO')} ${icono}!**` } })],
        flags: MessageFlags.IsComponentsV2,
      });
      return;
    }

    await interaction.reply({ components: [construirContainer()], flags: MessageFlags.IsComponentsV2 });
    const respuestaMensaje = await interaction.fetchReply();

    const collector = respuestaMensaje.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 60000,
    });

    async function resolverDealer(botonInteraction) {
      while (valorMano(manoDealer) < 17) {
        manoDealer.push(mazo.pop());
      }

      const valorJugador = valorMano(manoJugador);
      const valorDealer = valorMano(manoDealer);

      let resultado;
      if (valorDealer > 21 || valorJugador > valorDealer) {
        const premio = apuesta * 2;
        usuario.cartera += premio;
        resultado = { texto: `🎉 **¡Ganaste ${premio.toLocaleString('es-CO')} ${icono}!**` };
      } else if (valorJugador === valorDealer) {
        usuario.cartera += apuesta;
        resultado = { texto: `🤝 Empate. Se te devolvió tu apuesta de ${apuesta.toLocaleString('es-CO')} ${icono}.` };
      } else {
        resultado = { texto: `💀 Perdiste ${apuesta.toLocaleString('es-CO')} ${icono}.` };
      }

      await usuario.save();
      const payload = { components: [construirContainer({ terminado: true, resultado })], flags: MessageFlags.IsComponentsV2 };

      if (botonInteraction) {
        await botonInteraction.update(payload);
      } else {
        await interaction.editReply(payload);
      }
    }

    collector.on('collect', async (botonInteraction) => {
      if (botonInteraction.customId === 'bj_hit') {
        manoJugador.push(mazo.pop());

        if (valorMano(manoJugador) > 21) {
          collector.stop('bust');
          await botonInteraction.update({
            components: [construirContainer({ terminado: true, resultado: { texto: `💀 Te pasaste de 21. Perdiste ${apuesta.toLocaleString('es-CO')} ${icono}.` } })],
            flags: MessageFlags.IsComponentsV2,
          });
          return;
        }

        await botonInteraction.update({ components: [construirContainer()], flags: MessageFlags.IsComponentsV2 });
        return;
      }

      if (botonInteraction.customId === 'bj_stand') {
        collector.stop('stand');
        await resolverDealer(botonInteraction);
      }
    });

    collector.on('end', async (colecciones, razon) => {
      if (razon === 'time') {
        await resolverDealer(null);
      }
    });
  },
};
