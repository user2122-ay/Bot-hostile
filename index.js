// index.js
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Events,
  MessageFlags,
  ContainerBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
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
const ESTADO_BOT = { nombre: 'vigilando el estado 👮', tipo: ActivityType.Playing };
// ------------------------------------

// Se registra solo cada vez que el bot arranca. No hace falta correr nada a mano.
async function registrarComandos() {
  const comandosGlobales = [
    new SlashCommandBuilder()
      .setName('estado')
      .setDescription('Panel de rol (estado/policía)')
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
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: comandosGlobales,
  });
  console.log('✅ Comando /estado registrado (global).');
}

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Conectado como ${c.user.tag}`);

  c.user.setPresence({
    activities: [{ name: ESTADO_BOT.nombre, type: ESTADO_BOT.tipo }],
    status: 'online',
  });

  try {
    await registrarComandos();
  } catch (err) {
    console.error('❌ Error registrando comandos:', err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'estado') {
    await interaction.reply({
      components: [buildPanelInicio()],
      flags: MessageFlags.IsComponentsV2,
    });
    return;
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'btn_entrar_servicio') {
      await interaction.reply({ content: '🚔 Entraste en servicio.', ephemeral: true });
    }
    if (interaction.customId === 'btn_salir_servicio') {
      await interaction.reply({ content: '🚪 Saliste de servicio.', ephemeral: true });
    }
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'select_rol') {
    const elegido = interaction.values[0];
    await interaction.reply({ content: `Elegiste: **${elegido}**`, ephemeral: true });
  }
});

function buildPanelInicio() {
  return new ContainerBuilder()
    .setAccentColor(COLOR_ESTADO)
    .addTextDisplayComponents((td) =>
      td.setContent('## 🚓 Panel de Rol — Estado\nElegí una acción para empezar.'),
    )
    .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))
    .addActionRowComponents((row) =>
      row.setComponents(
        new ButtonBuilder()
          .setCustomId('btn_entrar_servicio')
          .setLabel('Entrar en servicio')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('btn_salir_servicio')
          .setLabel('Salir de servicio')
          .setStyle(ButtonStyle.Danger),
      ),
    )
    .addActionRowComponents((row) =>
      row.setComponents(
        new StringSelectMenuBuilder()
          .setCustomId('select_rol')
          .setPlaceholder('Elegí tu rol...')
          .addOptions(
            { label: 'Policía', value: 'policia', emoji: '👮' },
            { label: 'Civil', value: 'civil', emoji: '🙂' },
            { label: 'Médico', value: 'medico', emoji: '⚕️' },
          ),
      ),
    );
}

client.login(process.env.DISCORD_TOKEN);
