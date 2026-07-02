const { Events, ActivityType, REST, Routes } = require('discord.js');

const ESTADOS = [
  { nombre: 'vigilando Medellín Roleplay 👮', tipo: ActivityType.Playing },
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

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Conectado como ${client.user.tag}`);

    function rotarEstado() {
      const estado = ESTADOS[indiceEstado];
      client.user.setPresence({
        activities: [{ name: estado.nombre, type: estado.tipo }],
        status: 'online',
      });
      indiceEstado = (indiceEstado + 1) % ESTADOS.length;
    }

    rotarEstado();
    setInterval(rotarEstado, 15000);

    try {
      const comandos = client.commands.map((c) => c.data.toJSON());
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      await rest.put(Routes.applicationCommands(client.user.id), { body: comandos });
      console.log(`✅ ${comandos.length} comando(s) registrado(s) (global).`);
    } catch (err) {
      console.error('❌ Error registrando comandos:', err);
    }
  },
};
