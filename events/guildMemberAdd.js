const { Events, ContainerBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

// ---------- CONFIG ----------
const CANAL_BIENVENIDA_ID = '1406071037850026125';
const IMAGEN_BIENVENIDA =
  'https://cdn.discordapp.com/attachments/1522383991729160404/1522384144921792592/BIENVENID_20260628_163525_00002-1.jpg';
const NOMBRE_SERVER = 'Medellín Roleplay';

// Cambiá estos IDs por los canales reales de tu server (click derecho en el canal -> Copiar ID)
const CANAL_REGLAS_ID = '000000000000000000';
const CANAL_VERIFICACION_ID = '000000000000000000';
const CANAL_ROLES_ID = '000000000000000000';
const CANAL_AYUDA_ID = '000000000000000000';

// 6 colores, uno distinto por cada miembro que entra (rotan en círculo).
const COLORES_BIENVENIDA = [
  0x1f3a5f, // azul
  0xc0392b, // rojo
  0x27ae60, // verde
  0xf1c40f, // dorado
  0x8e44ad, // violeta
  0xe67e22, // naranja
];
let indiceColor = 0;

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member) {
    try {
      const canal = await member.client.channels.fetch(CANAL_BIENVENIDA_ID);
      if (!canal) return;

      const color = COLORES_BIENVENIDA[indiceColor];
      indiceColor = (indiceColor + 1) % COLORES_BIENVENIDA.length;

      const container = new ContainerBuilder()
        .setAccentColor(color)

        // ---- Encabezado ----
        .addTextDisplayComponents((td) =>
          td.setContent(
            `# 🚨 Bienvenido a ${NOMBRE_SERVER}\n` +
              `¡Hola ${member}! Acabás de llegar a la ciudad. Ya somos **${member.guild.memberCount}** miembros en total.`,
          ),
        )

        .addSeparatorComponents((sep) =>
          sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
        )

        // ---- Imagen de bienvenida ----
        .addMediaGalleryComponents((gallery) =>
          gallery.addItems((item) =>
            item.setURL(IMAGEN_BIENVENIDA).setDescription(`Bienvenida a ${NOMBRE_SERVER}`),
          ),
        )

        .addSeparatorComponents((sep) =>
          sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
        )

        // ---- Instrucciones ----
        .addTextDisplayComponents((td) =>
          td.setContent(
            `## 📋 Antes de empezar a rolear\n` +
              `Seguí estos pasos en orden para que tu paso por la ciudad sea legal:\n\n` +
              `**1.** Leé el reglamento en <#${CANAL_REGLAS_ID}>. Se aplica sin excepciones, tanto para civiles como para policía.\n` +
              `**2.** Pasá por <#${CANAL_VERIFICACION_ID}> para verificarte y desbloquear el resto del servidor.\n` +
              `**3.** Elegí tu facción o rol en <#${CANAL_ROLES_ID}> (Policía, Civil, Médico, entre otros).\n` +
              `**4.** Cualquier duda, preguntá en <#${CANAL_AYUDA_ID}>, el staff está para ayudarte.`,
          ),
        )

        .addSeparatorComponents((sep) =>
          sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true),
        )

        // ---- Cierre ----
        .addTextDisplayComponents((td) =>
          td.setContent(
            `-# Disfrutá tu estadía en ${NOMBRE_SERVER}. Recordá que todo rol tiene consecuencias — actuá en consecuencia.`,
          ),
        );

      await canal.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (err) {
      console.error('❌ Error mandando bienvenida:', err);
    }
  },
};
