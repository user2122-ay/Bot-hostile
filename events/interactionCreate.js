const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
  ContainerBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  AttachmentBuilder,
} = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');
const { DEPARTAMENTOS, CANAL_REGISTROS_ID, emojiMencion } = require('../utils/ticketsConfig');
const { siguienteNumero } = require('../utils/tickets');
const Ticket = require('../models/Ticket');
const { generarTranscripcionHTML } = require('../utils/transcripcion');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, interaction.client);
      } catch (err) {
        console.error(`❌ Error ejecutando /${interaction.commandName}:`, err);
        const mensajeError = { content: 'Hubo un error ejecutando el comando.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(mensajeError);
        } else {
          await interaction.reply(mensajeError);
        }
      }
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_categoria') {
      await manejarCreacionTicket(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'economia_depositar' || interaction.customId === 'economia_retirar') {
        const esDeposito = interaction.customId === 'economia_depositar';
        const modal = new ModalBuilder()
          .setCustomId(esDeposito ? 'modal_depositar' : 'modal_retirar')
          .setTitle(esDeposito ? 'Depositar en el banco' : 'Retirar del banco');

        const inputCantidad = new TextInputBuilder()
          .setCustomId('cantidad')
          .setLabel('¿Cuánto?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ej: 500')
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(inputCantidad));
        await interaction.showModal(modal);
        return;
      }

      if (interaction.customId === 'ticket_cerrar') {
        await manejarCierreTicket(interaction);
        return;
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_depositar' || interaction.customId === 'modal_retirar') {
        const esDeposito = interaction.customId === 'modal_depositar';
        const cantidad = parseInt(interaction.fields.getTextInputValue('cantidad'), 10);

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
          await interaction.reply({ content: '❌ Ingresá un número válido mayor a 0.', ephemeral: true });
          return;
        }

        const usuario = await obtenerUsuario(interaction.user.id);
        const icono = await obtenerIconoMoneda();

        if (esDeposito) {
          if (usuario.cartera < cantidad) {
            await interaction.reply({
              content: `❌ No tenés suficiente en la cartera. Tenés ${usuario.cartera.toLocaleString('es-CO')} ${icono}.`,
              ephemeral: true,
            });
            return;
          }
          usuario.cartera -= cantidad;
          usuario.banco += cantidad;
        } else {
          if (usuario.banco < cantidad) {
            await interaction.reply({
              content: `❌ No tenés suficiente en el banco. Tenés ${usuario.banco.toLocaleString('es-CO')} ${icono}.`,
              ephemeral: true,
            });
            return;
          }
          usuario.banco -= cantidad;
          usuario.cartera += cantidad;
        }

        await usuario.save();

        await interaction.reply({
          content:
            `✅ ${esDeposito ? 'Depositaste' : 'Retiraste'} ${cantidad.toLocaleString('es-CO')} ${icono}.\n` +
            `**Cartera:** ${usuario.cartera.toLocaleString('es-CO')} ${icono}\n` +
            `**Banco:** ${usuario.banco.toLocaleString('es-CO')} ${icono}`,
          ephemeral: true,
        });
      }
    }
  },
};

async function manejarCreacionTicket(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const departamentoId = interaction.values[0];
  const dep = DEPARTAMENTOS[departamentoId];
  if (!dep) {
    await interaction.editReply('❌ Departamento no válido.');
    return;
  }

  const ticketExistente = await Ticket.findOne({
    usuarioId: interaction.user.id,
    departamento: departamentoId,
    abierto: true,
  });

  if (ticketExistente) {
    await interaction.editReply(`⚠️ Ya tenés un ticket abierto de **${dep.label}**: <#${ticketExistente.canalId}>`);
    return;
  }

  const numero = await siguienteNumero(departamentoId);
  const numeroFormateado = String(numero).padStart(4, '0');
  const nombreCanal = `${departamentoId.replace(/_/g, '-')}-${numeroFormateado}`;
  const canalPanel = interaction.channel;

  const nuevoCanal = await interaction.guild.channels.create({
    name: nombreCanal,
    type: ChannelType.GuildText,
    parent: canalPanel.parentId ?? undefined,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: dep.roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ],
  });

  await Ticket.create({
    canalId: nuevoCanal.id,
    usuarioId: interaction.user.id,
    departamento: departamentoId,
    numero,
    abierto: true,
  });

  const container = new ContainerBuilder()
    .setAccentColor(dep.color)
    .addTextDisplayComponents((td) =>
      td.setContent(
        `# ${emojiMencion(dep)} Ticket — ${dep.label}\n` +
          `Hola ${interaction.user}, un miembro de **${dep.label}** (<@&${dep.roleId}>) te va a atender pronto.\n\n` +
          `Contá tu situación con el mayor detalle posible mientras esperás.`,
      ),
    )
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder().setCustomId('ticket_cerrar').setLabel('Cerrar ticket').setStyle(ButtonStyle.Danger),
      ),
    );

  await nuevoCanal.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });

  await interaction.editReply(`✅ Tu ticket fue creado: ${nuevoCanal}`);
}

async function manejarCierreTicket(interaction) {
  await interaction.deferReply();

  const ticket = await Ticket.findOne({ canalId: interaction.channel.id, abierto: true });
  if (!ticket) {
    await interaction.editReply('❌ Este canal no es un ticket abierto.');
    return;
  }

  await interaction.editReply('🔒 Cerrando ticket y generando transcripción...');

  const html = await generarTranscripcionHTML(interaction.channel);
  const archivo = new AttachmentBuilder(Buffer.from(html, 'utf-8'), {
    name: `transcripcion-${interaction.channel.name}.html`,
  });

  const dep = DEPARTAMENTOS[ticket.departamento];
  const canalRegistros = await interaction.client.channels.fetch(CANAL_REGISTROS_ID);

  const container = new ContainerBuilder()
    .setAccentColor(dep ? dep.color : 0x1f3a5f)
    .addTextDisplayComponents((td) =>
      td.setContent(
        `## 📄 Ticket cerrado\n` +
          `**Departamento:** ${dep ? dep.label : ticket.departamento}\n` +
          `**Número:** #${String(ticket.numero).padStart(4, '0')}\n` +
          `**Usuario:** <@${ticket.usuarioId}>\n` +
          `**Cerrado por:** ${interaction.user}\n` +
          `**Abierto el:** ${ticket.creadoEn.toLocaleString('es-CO')}`,
      ),
    );

  await canalRegistros.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    files: [archivo],
  });

  ticket.abierto = false;
  ticket.cerradoEn = new Date();
  await ticket.save();

  await interaction.channel.send('🗑️ Este canal se va a borrar en 5 segundos.');
  setTimeout(() => {
    interaction.channel.delete().catch((err) => console.error('❌ Error borrando canal de ticket:', err));
  }, 5000);
    }
