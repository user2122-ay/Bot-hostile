const { Events, ContainerBuilder, SeparatorSpacingSize, MessageFlags } = require('discord.js');

// ---------- CONFIG ----------
const CANAL_BIENVENIDA_ID = '1531111628081336450';
const IMAGEN_BIENVENIDA =
  'https://cdn.discordapp.com/attachments/1540819885813399723/1540892627396722768/BIENVENID_20260822_201132_0000.png?ex=6a8b9b96&is=6a8a4a16&hm=d6220d2ee2c7712929afc5d2421cf5d179369b7980f4a472b7c94042fc8a3099&';
const NOMBRE_SERVER = 'Medellín Roleplay';

const CANAL_REGLAS_ID = '1531112187060555807';
const CANAL_VERIFICACION_ID = '1531111985016475738';
const CANAL_ROLES_ID = '1537956027629183057';
const CANAL_AYUDA_ID = '1536880178167291904';

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
            `# 🚨 Bienvenido a La Nación RP \n` +
              `¡Hola ${member}! Acabás de llegar a la ciudad. Ya somos **${member.guild.memberCount}** miembros en total.`,
          ),
        )

        .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))

        // ---- Imagen de bienvenida ----
        .addMediaGalleryComponents((gallery) =>
          gallery.addItems((item) =>
            item.setURL(IMAGEN_BIENVENIDA).setDescription(`Bienvenida a ${NOMBRE_SERVER}`),
          ),
        )

        .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))

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

        .addSeparatorComponents((sep) => sep.setSpacing(SeparatorSpacingSize.Small).setDivider(true))

        // ---- Cierre ----
        .addTextDisplayComponents((td) =>
          td.setContent(
            `-# Disfrutá tu estadía en La Nación Rp. Recordá que todo rol tiene consecuencias — actuá en consecuencia.`,
          ),
        );

      await canal.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (err) {
      if (err.code === 10003) {
        console.warn(`⚠️ Canal de bienvenida (${CANAL_BIENVENIDA_ID}) no existe o el bot no tiene acceso.`);
      } else {
        console.error('❌ Error mandando bienvenida:', err);
      }
    }
  },
};
