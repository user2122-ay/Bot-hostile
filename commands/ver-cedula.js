const { SlashCommandBuilder } = require('discord.js');
const Cedula = require('../models/Cedula');
const { construirMensajeFrente } = require('../utils/cedulaFlow');

module.exports = {
  data: new SlashCommandBuilder().setName('ver-cedula').setDescription('Ver tu cédula de ciudadanía roleplay'),

  async execute(interaction) {
    await interaction.deferReply(); // pública

    const cedula = await Cedula.findOne({ userId: interaction.user.id });
    if (!cedula) {
      await interaction.editReply('❌ Todavía no tenés una cédula. Usá /crear-cedula para hacerla.');
      return;
    }

    const mensaje = await construirMensajeFrente(cedula);
    await interaction.editReply(mensaje);
  },
};
