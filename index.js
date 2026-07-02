// index.js
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Events,
  MessageFlags,
  ContainerBuilder,
  ActivityType,
  REST,
  Routes,
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ---------- CONFIG RÁPIDA ----------
const COLOR_ESTADO = 0x1f3a5f;
const NOMBRE_SERVER = 'Medellín Roleplay';

// Mínimo 15 estados, rotan cada 15 segundos.
const ESTADOS = [
  { nombre: `vigilando ${NOMBRE_SERVER} 👮`, tipo: ActivityType.Playing },
  { nombre: 'las calles de Medellín', tipo: ActivityType.Watching },
  { nombre: 'reportes de la comuna', tipo: ActivityType.Watching },
  { nombre: 'la radio de la policía', tipo: ActivityType.Listening },
  { nombre: 'patrullando El Poblado', tipo: ActivityType.Playing },
  { nombre: 'el orden público', tipo: ActivityType.Watching },
  { nombre: 'llamadas al 123', tipo: ActivityType.Listening },
  { nombre: 'las cámaras de tránsito', tipo: ActivityType.Watching },
  { nombre: 'controlando la ciudad', tipo: ActivityType.Playing },
  { nombre: 'el turno de guardia', tipo: ActivityType.Competing },
  { nombre: 'los reportes de la alcaldía', tipo: ActivityType.Watching },
  { nombre: 'el tráfico de la Regional', tipo: ActivityType.Watching },
  { nombre: 'novedades del cuadrante', tipo: ActivityType.Playing },
  { nombre: 'el parte diario', tipo: ActivityType.Listening },
  { nombre: 'a los ciudadanos de Medellín', tipo: ActivityType.Watching },
];

let indiceEstado = 0;

function rotarEstado() {
  const estado = ESTADOS[indiceEstado];
  client.user.setPresence({
    activities: [{ name: estado.nombre, type: estado.tipo }],
    status: 'online',
  });
  indiceEstado = (indiceEstado + 1) % ESTADOS.length;
}

// ---------- Registro del comando (se hace solo, no hace falta correr nada a mano) ----------
async function registrarComandos() {
  const comandos = [
    new SlashCommandBuilder()
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
  ].map((c) => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: comandos });
  console.log('✅ /estado registrado (global).');
}

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Conectado como ${c.user.tag}`);

  rotarEstado();
  setInterval(rotarEstado, 15000);

  try {
    await registrarComandos();
  } catch (err) {
    console.error('❌ Error registrando comandos:', err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'estado') {
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
  }
});

function formatearUptime(ms) {
  const segundos = Math.floor(ms / 1000) % 60;
  const minutos = Math.floor(ms / (1000 * 60)) % 60;
  const horas = Math.floor(ms / (1000 * 60 * 60));
  return `${horas}h ${minutos}m ${segundos}s`;
}

client.login(process.env.DISCORD_TOKEN);
