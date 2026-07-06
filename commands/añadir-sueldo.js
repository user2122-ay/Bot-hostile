const { SlashCommandBuilder } = require('discord.js');
const Sueldo = require('../models/Sueldo');
const { obtenerIconoMoneda } = require('../utils/economia');
const { esAdminEconomia } = require('../utils/permisos');
const { enviarLogEconomia } = require('../utils/economiaLogs');
const { formatearIntervalo } = require('../utils/tiempo');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('añadir-sueldo')
    .setDescription('Asignar o actualizar el sueldo de un rol (staff economía)')
    .addRoleOption((opt) => opt.setName('rol').setDescription('Rol a configurar').setRequired(true))
    .addIntegerOption((opt) => opt.setName('cantidad').setDescription('Monto del sueldo').setRequired(true).setMinValue(1))
    .addIntegerOption((opt) =>
      opt.setName('tiempo').setDescription('Cada cuántos minutos se puede cobrar').setRequired(true).setMinValue(1),
    ),

  async execute(interaction) {
    if (!esAdminEconomia(interaction)) {
      await interaction.reply({ content: '❌ No tenés permiso para usar este comando.', ephemeral: true });
      return;
    }

    const rol = interaction.options.getRole('rol');
    const cantidad = interaction.options.getInteger('cantidad');
    const tiempo = interaction.options.getInteger('tiempo');

    await Sueldo.findOneAndUpdate(
      { roleId: rol.id },
      { roleId: rol.id, monto: cantidad, intervaloMinutos: tiempo },
      { upsert: true },
    );

    const icono = await obtenerIconoMoneda();
    await interaction.reply({
      content: `💼 El rol ${rol} ahora tiene un sueldo de ${cantidad.toLocaleString('es-CO')} ${icono} cada ${formatearIntervalo(tiempo)}`,
      ephemeral: true,
    });

    await enviarLogEconomia(
      interaction.client,
      '💼 Sueldo asignado',
      `**Staff:** ${interaction.user}\n**Rol:** ${rol}\n**Monto:** ${cantidad.toLocaleString('es-CO')} ${icono}\n**Cada:** ${formatearIntervalo(tiempo)}`,
    );
  },
};
