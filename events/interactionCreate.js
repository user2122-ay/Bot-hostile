const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

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
  },
};
