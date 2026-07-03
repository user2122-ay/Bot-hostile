require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { conectarMongo } = require('./utils/db');

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`📦 Comando cargado: /${command.data.name}`);
  } else {
    console.warn(`⚠️ El archivo commands/${file} no tiene 'data' o 'execute', se ignora.`);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`📡 Evento cargado: ${event.name}`);
}

client.on('shardDisconnect', () => console.warn('⚠️ Desconectado de Discord, reconectando...'));
client.on('shardReconnecting', () => console.log('🔄 Reconectando a Discord...'));
client.on('error', (err) => console.error('❌ Client error:', err));

async function iniciar() {
  try {
    await conectarMongo();
  } catch (err) {
    console.error('❌ Error conectando a MongoDB, reintentando en 10s...', err);
    setTimeout(iniciar, 10000);
    return;
  }

  await client.login(process.env.DISCORD_TOKEN);
}

iniciar();
