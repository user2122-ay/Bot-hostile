const { ContainerBuilder, MessageFlags } = require('discord.js');

const CANAL_LOGS_ECONOMIA_ID = '1522738738847813692';
const COLOR_LOG = 0x95a5a6;

async function enviarLogEconomia(client, titulo, detalle) {
  try {
    const canal = await client.channels.fetch(CANAL_LOGS_ECONOMIA_ID);
    const container = new ContainerBuilder()
      .setAccentColor(COLOR_LOG)
      .addTextDisplayComponents((td) => td.setContent(`### 📋 ${titulo}\n${detalle}`));
    await canal.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
  } catch (err) {
    console.error('❌ Error mandando log de economía:', err);
  }
}

module.exports = { enviarLogEconomia };
