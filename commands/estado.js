const {
  SlashCommandBuilder,
  ContainerBuilder,
  MessageFlags,
  ApplicationIntegrationType,
  InteractionContextType,
} = require('discord.js');

const NOMBRE_SERVER = 'Medellín Roleplay';
const COLOR_ESTADO = 0x1f3a5f;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('estado')
    .setDescription('Muestra si el bot está encendido y qué está haciendo')
    .setIntegrationTypes(
      ApplicationIntegrationType.GuildInstall,
      ApplicationIntegrationType.UserInstall,
    )
    .setContexts(
      InteractionContextType.Guild,
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
    ),

  async execute(interaction, client) {
    const latencia = Math.round(client.ws.ping);
    const uptime = formatearUptime(client.uptime);
    const actividadActual = client.user.presence.activities[0]?.name ?? 'sin actividad';

    const container = new ContainerBuilder()
      .setAccentColor(COLOR_ESTADO)
      .addTextDisplayComponents((td) =>
        td.setContent(
          `## 🟢 Bot en línea — ${NOMBRE_SERVER}\n` +
            `**Haciendo ahora:** ${actividadActual}\n` +
            `**Latencia:** ${latencia}ms\n` +
            `**Tiempo activo:** ${uptime}\n` +
            `**Servidores conectados:** ${client.guilds.cache.size}`,
        ),
      );

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};

function formatearUptime(ms) {
  const segundos = Math.floor(ms / 1000) % 60;
  const minutos = Math.floor(ms / (1000 * 60)) % 60;
  const horas = Math.floor(ms / (1000 * 60 * 60));
  return `${horas}h ${minutos}m ${segundos}s`;
}
