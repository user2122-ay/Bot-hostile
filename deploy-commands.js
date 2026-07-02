// deploy-commands.js
require('dotenv').config();
const {
  REST,
  Routes,
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType,
} = require('discord.js');

// ---------- COMANDOS GLOBALES (instalables en el perfil, sirven en cualquier lado) ----------
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

// ---------- COMANDOS SOLO DE SERVIDOR (acá van los que sumemos después: moderación, etc.) ----------
const comandosDeServidor = [
  // ejemplo para cuando sumemos moderación:
  // new SlashCommandBuilder().setName('detener').setDescription('Detener a un usuario (RP)'),
].map((c) => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Registrando ${comandosGlobales.length} comando(s) global(es)...`);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: comandosGlobales,
    });
    console.log('✅ Global registrado (puede tardar hasta 1h en propagarse).');

    if (comandosDeServidor.length > 0) {
      if (!process.env.GUILD_ID) {
        console.warn('⚠️ Tenés comandos de servidor pero falta GUILD_ID en .env, no se registraron.');
      } else {
        console.log(`Registrando ${comandosDeServidor.length} comando(s) de servidor...`);
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: comandosDeServidor },
        );
        console.log('✅ Comandos de servidor registrados (instantáneo).');
      }
    }
  } catch (error) {
    console.error(error);
  }
})();
