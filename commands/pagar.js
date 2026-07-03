const { SlashCommandBuilder, ContainerBuilder, MessageFlags } = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');
const { IMPUESTO_TRANSFERENCIA_PORCENTAJE } = require('../utils/economiaConfig');

const COLOR_ECONOMIA = 0x27ae60;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pagar')
    .setDescription(`Transferir dinero de tu cartera a otro usuario (se cobra ${IMPUESTO_TRANSFERENCIA_PORCENTAJE}% de impuesto)`)
    .addUserOption((opt) => opt.setName('usuario').setDescription('A quién le pagás').setRequired(true))
    .addIntegerOption((opt) =>
      opt.setName('cantidad').setDescription('Cuánto le pagás (antes de impuestos)').setRequired(true).setMinValue(1),
    ),

  async execute(interaction) {
    const objetivo = interaction.options.getUser('usuario');
    const cantidad = interaction.options.getInteger('cantidad');

    if (objetivo.id === interaction.user.id) {
      await interaction.reply({ content: '❌ No te podés pagar a vos mismo.', ephemeral: true });
      return;
    }
    if (objetivo.bot) {
      await interaction.reply({ content: '❌ No le podés pagar a un bot.', ephemeral: true });
      return;
    }

    const remitente = await obtenerUsuario(interaction.user.id);
    const icono = await obtenerIconoMoneda();

    if (remitente.cartera < cantidad) {
      await interaction.reply({
        content: `❌ No tenés suficiente en la cartera. Tenés ${remitente.cartera.toLocaleString('es-CO')} ${icono}.`,
        ephemeral: true,
      });
      return;
    }

    const impuesto = Math.ceil((cantidad * IMPUESTO_TRANSFERENCIA_PORCENTAJE) / 100);
    const montoRecibido = cantidad - impuesto;

    const destinatario = await obtenerUsuario(objetivo.id);

    remitente.cartera -= cantidad;
    destinatario.cartera += montoRecibido;

    await remitente.save();
    await destinatario.save();

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_ECONOMIA)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `## 💸 Transferencia realizada\n` +
            `${interaction.user} le pagó a ${objetivo}\n\n` +
            `**Monto:** ${cantidad.toLocaleString('es-CO')} ${icono}\n` +
            `**Impuesto (${IMPUESTO_TRANSFERENCIA_PORCENTAJE}%):** ${impuesto.toLocaleString('es-CO')} ${icono}\n` +
            `**Recibido:** ${montoRecibido.toLocaleString('es-CO')} ${icono}`,
        ),
      );

    await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
