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
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ---------- CONFIG RÁPIDA ----------
const COLOR_ESTADO = 0x1f3a5f; // azul institucional, cambialo si querés
const ESTADO_BOT = { nombre: 'vigilando el estado 👮', tipo: ActivityType.Playing };
// ------------------------------------

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Conectado como ${c.user.tag}`);
  c.user.setPresence({
    activities: [{ name: ESTADO_BOT.nombre, type: ESTADO_BOT.tipo }],
    status: 'online',
  });
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
