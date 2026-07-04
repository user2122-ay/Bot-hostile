const { SlashCommandBuilder, ContainerBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const Cedula = require('../models/Cedula');
const { generarFrente, generarAtras } = require('../utils/cedulaImagen');

module.exports = {
  data: new SlashCommandBuilder().setName('ver-cedula').setDescription('Ver tu cédula de ciudadanía roleplay'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const cedula = await Cedula.findOne({ userId: interaction.user.id });
    if (!cedula) {
      await interaction.editReply('❌ Todavía no tenés una cédula. Usá /crear-cedula para hacerla.');
      return;
    }

    const bufferFrente = await generarFrente(cedula);
    const bufferAtras = await generarAtras(cedula);

    const archivoFrente = new AttachmentBuilder(bufferFrente, { name: 'cedula-frente.png' });
    const archivoAtras = new AttachmentBuilder(bufferAtras, { name: 'cedula-atras.png' });

    const container = new ContainerBuilder()
      .setAccentColor(0x1f3a5f)
      .addTextDisplayComponents((td) => td.setContent(`## 🪪 Cédula de ${cedula.nombres} ${cedula.apellidos}\nNIRP: ${cedula.nirp}`))
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
  },
};
