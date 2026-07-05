const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  AttachmentBuilder,
} = require('discord.js');
const CedulaPendiente = require('../models/CedulaPendiente');
const Cedula = require('../models/Cedula');
const Usuario = require('../models/Usuario');
const { siguienteNirp } = require('./cedula');
const { generarFrente, generarAtras } = require('./cedulaImagen');

const ROL_CEDULA_ID = '1457616470250098699';

async function manejarModal1(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const apellidos = interaction.fields.getTextInputValue('apellidos').trim();
  const nombres = interaction.fields.getTextInputValue('nombres').trim();
  const nacionalidad = interaction.fields.getTextInputValue('nacionalidad').trim();
  const sexo = interaction.fields.getTextInputValue('sexo').trim();

  await CedulaPendiente.findOneAndUpdate(
    { userId: interaction.user.id },
    { userId: interaction.user.id, apellidos, nombres, nacionalidad, sexo },
    { upsert: true },
  );

  const boton = new ButtonBuilder().setCustomId('cedula_continuar_2').setLabel('Continuar con el resto de los datos').setStyle(ButtonStyle.Primary);
  await interaction.editReply({ content: 'Ya casi. Tocá para completar los últimos datos.', components: [new ActionRowBuilder().addComponents(boton)] });
}

async function abrirModal2(interaction) {
  const modal = new ModalBuilder().setCustomId('modal_cedula_2').setTitle('Cédula — Datos (2/2)');

  const campos = [
    { id: 'tipoSangre', label: 'Tipo de sangre (ej: O+)' },
    { id: 'fechaNacimiento', label: 'Fecha de nacimiento' },
    { id: 'lugarNacimiento', label: 'Lugar de nacimiento' },
    { id: 'lugarExpedicion', label: 'Lugar de expedición' },
  ];

  campos.forEach((c) => {
    const input = new TextInputBuilder().setCustomId(c.id).setLabel(c.label).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(40);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
  });

  await interaction.showModal(modal);
}

// Arma el mensaje con SOLO el frente + botón para pasar al reverso.
async function construirMensajeFrente(cedula) {
  const buffer = await generarFrente(cedula);
  const archivo = new AttachmentBuilder(buffer, { name: 'cedula-frente.png' });

  const container = new ContainerBuilder()
    .setAccentColor(0x1f3a5f)
    .addTextDisplayComponents((td) => td.setContent(`## 🪪 Cédula de ${cedula.nombres} ${cedula.apellidos}\nNIRP: ${cedula.nirp}`))
    .addMediaGalleryComponents((gallery) => gallery.addItems((item) => item.setURL('attachment://cedula-frente.png')))
    .addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder().setCustomId(`cedula_reverso_${cedula.userId}`).setLabel('Ver reverso').setStyle(ButtonStyle.Secondary),
      ),
    );

  return { components: [container], flags: MessageFlags.IsComponentsV2, files: [archivo] };
}

// Arma el mensaje con SOLO el reverso + botón para volver al frente.
async function construirMensajeAtras(cedula) {
  const buffer = await generarAtras(cedula);
  const archivo = new AttachmentBuilder(buffer, { name: 'cedula-atras.png' });

  const container = new ContainerBuilder()
    .setAccentColor(0x1f3a5f)
    .addTextDisplayComponents((td) => td.setContent(`## 🪪 Reverso — ${cedula.nombres} ${cedula.apellidos}`))
    .addMediaGalleryComponents((gallery) => gallery.addItems((item) => item.setURL('attachment://cedula-atras.png')))
    .addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder().setCustomId(`cedula_frente_${cedula.userId}`).setLabel('Ver frente').setStyle(ButtonStyle.Secondary),
      ),
    );

  return { components: [container], flags: MessageFlags.IsComponentsV2, files: [archivo] };
}

async function manejarModal2(interaction) {
  await interaction.deferReply(); // pública, sin ephemeral

  const pendiente = await CedulaPendiente.findOne({ userId: interaction.user.id });
  if (!pendiente) {
    await interaction.editReply('❌ No encontré tus datos anteriores, empezá de nuevo con /crear-cedula.');
    return;
  }

  const tipoSangre = interaction.fields.getTextInputValue('tipoSangre').trim();
  const fechaNacimiento = interaction.fields.getTextInputValue('fechaNacimiento').trim();
  const lugarNacimiento = interaction.fields.getTextInputValue('lugarNacimiento').trim();
  const lugarExpedicion = interaction.fields.getTextInputValue('lugarExpedicion').trim();

  const nirp = await siguienteNirp();
  const fechaExpedicion = new Date().toLocaleDateString('es-CO');

  const usuario = await Usuario.findOne({ userId: interaction.user.id });
  const fotoUrl = usuario?.robloxAvatarUrl || interaction.user.displayAvatarURL({ extension: 'png', size: 512 });

  const datosCedula = {
    userId: interaction.user.id,
    nirp,
    apellidos: pendiente.apellidos,
    nombres: pendiente.nombres,
    nacionalidad: pendiente.nacionalidad,
    sexo: pendiente.sexo,
    tipoSangre,
    fechaNacimiento,
    lugarNacimiento,
    lugarExpedicion,
    fechaExpedicion,
    fotoUrl,
  };

  const cedula = await Cedula.findOneAndUpdate({ userId: interaction.user.id }, datosCedula, { upsert: true, new: true });
  await pendiente.deleteOne();

  const miembro = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (miembro) {
    await miembro.roles.add(ROL_CEDULA_ID).catch((err) => console.error('❌ Error asignando rol de cédula:', err));
  }

  const mensaje = await construirMensajeFrente(cedula);
  await interaction.editReply(mensaje);
}

module.exports = {
  manejarModal1,
  abrirModal2,
  manejarModal2,
  construirMensajeFrente,
  construirMensajeAtras,
};
