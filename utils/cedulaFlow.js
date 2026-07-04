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

async function manejarModal2(interaction) {
  await interaction.deferReply({ ephemeral: true });

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

  const bufferFrente = await generarFrente(cedula);
  const bufferAtras = await generarAtras(cedula);

  const archivoFrente = new AttachmentBuilder(bufferFrente, { name: 'cedula-frente.png' });
  const archivoAtras = new AttachmentBuilder(bufferAtras, { name: 'cedula-atras.png' });

  const container = new ContainerBuilder()
    .setAccentColor(0x1f3a5f)
    .addTextDisplayComponents((td) => td.setContent(`## 🪪 ¡Tu cédula fue creada!\nNIRP: ${nirp}`))
    .addMediaGalleryComponents((gallery) =>
      gallery.addItems(
        (item) => item.setURL('attachment://cedula-frente.png'),
        (item) => item.setURL('attachment://cedula-atras.png'),
      ),
    );

  await interaction.editReply({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    files: [archivoFrente, archivoAtras],
  });
}

module.exports = { manejarModal1, abrirModal2, manejarModal2 };
