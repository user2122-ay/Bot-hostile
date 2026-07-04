const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require('discord.js');
const VerificacionPendiente = require('../models/VerificacionPendiente');
const Usuario = require('../models/Usuario');
const {
  CANAL_REVISION_VERIFICACION_ID,
  ROL_STAFF_VERIFICACION_ID,
  ROL_NO_VERIFICADO_ID,
  ROL_VERIFICADO_ID,
  PREGUNTAS,
} = require('./verificacionConfig');
const { obtenerUsuarioRoblox, obtenerAvatarBustoRoblox } = require('./roblox');

// ---- Paso 1: click en "Verificarse" ----
async function iniciarVerificacion(interaction) {
  if (!interaction.member.roles.cache.has(ROL_NO_VERIFICADO_ID)) {
    await interaction.reply({ content: '❌ Este botón es solo para usuarios sin verificar.', ephemeral: true });
    return;
  }

  // Reinicia cualquier intento anterior sin terminar.
  await VerificacionPendiente.deleteOne({ userId: interaction.user.id });

  const modal = new ModalBuilder().setCustomId('modal_verificacion_usuario').setTitle('Verificación — Roblox');
  const input = new TextInputBuilder()
    .setCustomId('roblox_username')
    .setLabel('Tu usuario de Roblox (exacto)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

// ---- Paso 2: recibe el usuario de Roblox, muestra el avatar para confirmar ----
async function manejarModalUsername(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const username = interaction.fields.getTextInputValue('roblox_username').trim();
  const usuarioRoblox = await obtenerUsuarioRoblox(username);

  if (!usuarioRoblox) {
    await interaction.editReply('❌ No encontré ese usuario de Roblox. Revisá que esté bien escrito y volvé a tocar el botón del panel.');
    return;
  }

  const yaVerificado = await Usuario.findOne({ robloxUserId: String(usuarioRoblox.id) });
  if (yaVerificado) {
    await interaction.editReply(
      '❌ Esa cuenta de Roblox ya está vinculada a otro usuario verificado. Si creés que es un error, abrí un ticket con el staff.',
    );
    return;
  }

  const avatarUrl = await obtenerAvatarBustoRoblox(usuarioRoblox.id);

  await VerificacionPendiente.findOneAndUpdate(
    { userId: interaction.user.id },
    {
      userId: interaction.user.id,
      robloxUsername: usuarioRoblox.name,
      robloxUserId: String(usuarioRoblox.id),
      avatarUrl,
      respuestas: [],
    },
    { upsert: true },
  );

  const container = new ContainerBuilder().setAccentColor(0x1f3a5f);
  const textoConfirmacion = `## ¿Esta es tu cuenta?\n**Usuario de Roblox:** ${usuarioRoblox.name}`;

  if (avatarUrl) {
    container.addSectionComponents((section) =>
      section
        .addTextDisplayComponents((td) => td.setContent(textoConfirmacion))
        .setThumbnailAccessory((thumb) => thumb.setURL(avatarUrl)),
    );
  } else {
    container.addTextDisplayComponents((td) => td.setContent(textoConfirmacion));
  }

  container
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder().setCustomId('verificacion_confirmar_cuenta').setLabel('Sí, es mi cuenta').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('verificacion_negar_cuenta').setLabel('No, es otra').setStyle(ButtonStyle.Danger),
      ),
    );

  await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

// ---- Paso 3: usuario dice que NO es su cuenta ----
async function manejarNegarCuenta(interaction) {
  await VerificacionPendiente.deleteOne({ userId: interaction.user.id });

  const container = new ContainerBuilder()
    .setAccentColor(0xe74c3c)
    .addTextDisplayComponents((td) =>
      td.setContent('❌ Cancelado. Volvé a tocar **Verificarse** en el panel para intentarlo de nuevo con el usuario correcto.'),
    );

  await interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 });
}

// ---- Paso 4: primer modal de preguntas (1-5) ----
async function abrirPreguntas1(interaction) {
  const modal = new ModalBuilder().setCustomId('modal_verificacion_preguntas_1').setTitle('Preguntas de Roleplay (1/2)');
  PREGUNTAS.slice(0, 5).forEach((p) => {
    const input = new TextInputBuilder().setCustomId(p.id).setLabel(p.label).setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  });
  await interaction.showModal(modal);
}

async function manejarModalPreguntas1(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const pendiente = await VerificacionPendiente.findOne({ userId: interaction.user.id });
  if (!pendiente) {
    await interaction.editReply('❌ No encontré tu verificación pendiente, empezá de nuevo desde el panel.');
    return;
  }

  pendiente.respuestas = PREGUNTAS.slice(0, 5).map((p) => interaction.fields.getTextInputValue(p.id));
  await pendiente.save();

  const boton = new ButtonBuilder().setCustomId('verificacion_abrir_preguntas_2').setLabel('Continuar con las últimas preguntas').setStyle(ButtonStyle.Primary);
  await interaction.editReply({ content: 'Ya casi. Tocá para responder las últimas 3 preguntas.', components: [new ActionRowBuilder().addComponents(boton)] });
}

// ---- Paso 5: segundo modal de preguntas (6-8) ----
async function abrirPreguntas2(interaction) {
  const modal = new ModalBuilder().setCustomId('modal_verificacion_preguntas_2').setTitle('Preguntas de Roleplay (2/2)');
  PREGUNTAS.slice(5, 8).forEach((p) => {
    const input = new TextInputBuilder().setCustomId(p.id).setLabel(p.label).setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(500);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  });
  await interaction.showModal(modal);
}

// ---- Paso 6: arma el formulario final y lo manda a revisión ----
async function manejarModalPreguntas2(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const pendiente = await VerificacionPendiente.findOne({ userId: interaction.user.id });
  if (!pendiente) {
    await interaction.editReply('❌ No encontré tu verificación pendiente, empezá de nuevo desde el panel.');
    return;
  }

  const respuestasFinales = PREGUNTAS.slice(5, 8).map((p) => interaction.fields.getTextInputValue(p.id));
  pendiente.respuestas = [...pendiente.respuestas, ...respuestasFinales];
  await pendiente.save();

  const canalRevision = await interaction.client.channels.fetch(CANAL_REVISION_VERIFICACION_ID);
  const textoPreguntas = PREGUNTAS.map((p, i) => `**${i + 1}. ${p.pregunta}**\n${pendiente.respuestas[i]}`).join('\n\n');

  const container = new ContainerBuilder()
    .setAccentColor(0xf1c40f) // amarillo = pendiente de revisión
    .addTextDisplayComponents((td) =>
      td.setContent(`# 📋 Solicitud de verificación\n**Usuario Discord:** ${interaction.user} (\`${interaction.user.id}\`)\n**Usuario Roblox:** ${pendiente.robloxUsername}`),
    );

  if (pendiente.avatarUrl) {
    container.addSectionComponents((section) =>
      section.addTextDisplayComponents((td) => td.setContent('Avatar de Roblox:')).setThumbnailAccessory((thumb) => thumb.setURL(pendiente.avatarUrl)),
    );
  }

  container
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents((td) => td.setContent(textoPreguntas))
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents((td) => td.setContent('-# Estado: pendiente de revisión'))
    .addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder().setCustomId(`verificacion_aceptar_${interaction.user.id}`).setLabel('Aceptar').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`verificacion_denegar_${interaction.user.id}`).setLabel('Denegar').setStyle(ButtonStyle.Danger),
      ),
    );

  await canalRevision.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
  await interaction.editReply('✅ ¡Listo! Tu formulario fue enviado al staff. Te avisamos por mensaje directo cuando lo revisen.');
}

// ---- Paso 7: staff acepta o deniega ----
async function manejarDecisionStaff(interaction, decision) {
  if (!interaction.member.roles.cache.has(ROL_STAFF_VERIFICACION_ID)) {
    await interaction.reply({ content: '❌ No tenés permiso para revisar verificaciones.', ephemeral: true });
    return;
  }

  await interaction.deferUpdate();

  const userId = interaction.customId.split('_').pop();
  const pendiente = await VerificacionPendiente.findOne({ userId });

  if (!pendiente) {
    await interaction.followUp({ content: '⚠️ Esta verificación ya fue procesada o expiró.', ephemeral: true });
    return;
  }

  const textoPreguntas = PREGUNTAS.map((p, i) => `**${i + 1}. ${p.pregunta}**\n${pendiente.respuestas[i] ?? '—'}`).join('\n\n');
  const colorNuevo = decision === 'aceptar' ? 0x27ae60 : 0xe74c3c;
  const textoEstado = decision === 'aceptar' ? `✅ Aceptado por ${interaction.user}` : `❌ Denegado por ${interaction.user}`;

  const container = new ContainerBuilder()
    .setAccentColor(colorNuevo)
    .addTextDisplayComponents((td) =>
      td.setContent(`# 📋 Solicitud de verificación\n**Usuario Discord:** <@${userId}> (\`${userId}\`)\n**Usuario Roblox:** ${pendiente.robloxUsername}`),
    );

  if (pendiente.avatarUrl) {
    container.addSectionComponents((section) =>
      section.addTextDisplayComponents((td) => td.setContent('Avatar de Roblox:')).setThumbnailAccessory((thumb) => thumb.setURL(pendiente.avatarUrl)),
    );
  }

  container
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents((td) => td.setContent(textoPreguntas))
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addTextDisplayComponents((td) => td.setContent(`-# Estado: ${textoEstado}`));
  // No vuelvo a poner los botones: así queda cerrado y nadie lo puede volver a procesar.

  await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });

  let usuarioDiscord = null;
  try {
    usuarioDiscord = await interaction.client.users.fetch(userId);
  } catch {
    usuarioDiscord = null;
  }

  if (decision === 'aceptar') {
    const miembro = await interaction.guild.members.fetch(userId).catch(() => null);
    if (miembro) {
      await miembro.roles.add(ROL_VERIFICADO_ID).catch(() => null);
      await miembro.roles.remove(ROL_NO_VERIFICADO_ID).catch(() => null);
      await miembro.setNickname(pendiente.robloxUsername).catch(() => null);
    }

    await Usuario.findOneAndUpdate(
      { userId },
      { userId, robloxUsername: pendiente.robloxUsername, robloxUserId: pendiente.robloxUserId, robloxAvatarUrl: pendiente.avatarUrl },
      { upsert: true },
    );
  }

  if (usuarioDiscord) {
    const mensajeDM =
      decision === 'aceptar'
        ? '✅ Tu verificación en **Medellín Roleplay** fue **aceptada**. ¡Bienvenido!'
        : '❌ Tu verificación en **Medellín Roleplay** fue **denegada**. Podés volver a intentarlo desde el panel de verificación.';
    await usuarioDiscord.send(mensajeDM).catch(() => null);
  }

  await pendiente.deleteOne();
}

module.exports = {
  iniciarVerificacion,
  manejarModalUsername,
  manejarNegarCuenta,
  abrirPreguntas1,
  manejarModalPreguntas1,
  abrirPreguntas2,
  manejarModalPreguntas2,
  manejarDecisionStaff,
};
