const { SlashCommandBuilder, ContainerBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');
const { transferir, formatearMoneda, SaldoInsuficienteError } = require('../utils/economiaCore');
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

    try {
      const { impuesto, montoRecibido } = await transferir(
        interaction.user.id,
        objetivo.id,
        cantidad,
        IMPUESTO_TRANSFERENCIA_PORCENTAJE,
      );

      const montoTexto = await formatearMoneda(cantidad);
      const impuestoTexto = await formatearMoneda(impuesto);
      const recibidoTexto = await formatearMoneda(montoRecibido);

      const container = new ContainerBuilder()
        .setAccentColor(COLOR_ECONOMIA)
        .addSectionComponents((section) =>
          section
            .addTextDisplayComponents((td) =>
              td.setContent(`## 💸 Transferencia realizada\n${interaction.user} le pagó a ${objetivo}`),
            )
            .setThumbnailAccessory((thumb) => thumb.setURL(objetivo.displayAvatarURL())),
        )
        .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
        .addTextDisplayComponents((td) =>
          td.setContent(
            `**Monto:** ${montoTexto}\n` +
              `**Impuesto (${IMPUESTO_TRANSFERENCIA_PORCENTAJE}%):** ${impuestoTexto}\n` +
              `**Recibido:** ${recibidoTexto}`,
          ),
        );

      await interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    } catch (err) {
      if (err instanceof SaldoInsuficienteError) {
        const disponibleTexto = await formatearMoneda(err.disponible);
        await interaction.reply({
          content: `❌ No tenés suficiente en la cartera. Tenés ${disponibleTexto}.`,
          ephemeral: true,
        });
        return;
      }
      console.error('❌ Error en /pagar:', err);
      await interaction.reply({ content: '❌ Hubo un error procesando la transferencia.', ephemeral: true });
    }
  },
};

