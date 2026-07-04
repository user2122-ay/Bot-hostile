const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const Cedula = require('../models/Cedula');
const CedulaPendiente = require('../models/CedulaPendiente');

module.exports = {
  data: new SlashCommandBuilder().setName('crear-cedula').setDescription('Crear tu cédula de ciudadanía roleplay'),

  async execute(interaction) {
    const existente = await Cedula.findOne({ userId: interaction.user.id });
    if (existente) {
      await interaction.reply({
        content: '⚠️ Ya tenés una cédula creada. Usá /ver-cedula para verla. Si necesitás corregir un dato, contactá al staff.',
        ephemeral: true,
      });
      return;
    }

    await CedulaPendiente.deleteOne({ userId: interaction.user.id });

    const modal = new ModalBuilder().setCustomId('modal_cedula_1').setTitle('Cédula — Datos (1/2)');
    const campos = [
      { id: 'apellidos', label: 'Apellidos' },
      { id: 'nombres', label: 'Nombres' },
      { id: 'nacionalidad', label: 'Nacionalidad' },
      { id: 'sexo', label: 'Sexo (M/F)' },
    ];

    campos.forEach((c) => {
      const input = new TextInputBuilder().setCustomId(c.id).setLabel(c.label).setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(40);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
    });

    await interaction.showModal(modal);
  },
};
