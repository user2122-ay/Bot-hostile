const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { obtenerUsuario, obtenerIconoMoneda } = require('../utils/economia');

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
    // ---- Comandos slash ----
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

    // ---- Botones Depositar / Retirar de /balance ----
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
      }
      return;
    }

    // ---- Formulario de depositar/retirar ----
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
