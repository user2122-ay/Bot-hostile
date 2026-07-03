const CANAL_PANEL_VERIFICACION_ID = '1396967509562888353';
const CANAL_REVISION_VERIFICACION_ID = '1398224643932033106';
const ROL_STAFF_VERIFICACION_ID = '1426354376653668484';
const ROL_NO_VERIFICADO_ID = '1396525795702345849';
const ROL_VERIFICADO_ID = '1396525792787435580';

// "label" tiene que ser corto (límite de Discord: 45 caracteres) por eso algunas
// preguntas largas quedan resumidas en el label, pero la pregunta completa ("pregunta")
// se muestra igual en el panel y en el formulario final.
const PREGUNTAS = [
  { id: 'p1', pregunta: '¿Cómo conociste el servidor?', label: '¿Cómo conociste el servidor?' },
  { id: 'p2', pregunta: '¿Qué significa el concepto de "Roleplay"?', label: '¿Qué es el "Roleplay"?' },
  { id: 'p3', pregunta: '¿Qué es el "Metagaming (MG)"?', label: '¿Qué es el Metagaming (MG)?' },
  { id: 'p4', pregunta: '¿Qué es el "Powergaming (PG)"?', label: '¿Qué es el Powergaming (PG)?' },
  { id: 'p5', pregunta: '¿Qué es el "Deathmatch (DM)"?', label: '¿Qué es el Deathmatch (DM)?' },
  { id: 'p6', pregunta: '¿Qué es el "Player Kill (PK)"?', label: '¿Qué es el Player Kill (PK)?' },
  {
    id: 'p7',
    pregunta: 'Encuentras información en Discord sobre un personaje. ¿Puedes usarla en el rol? ¿Por qué?',
    label: 'Info de un personaje en Discord',
  },
  {
    id: 'p8',
    pregunta: 'Un jugador te apunta con un arma y tu personaje está desarmado. ¿Cómo deberías actuar?',
    label: 'Te apuntan y estás desarmado',
  },
];

module.exports = {
  CANAL_PANEL_VERIFICACION_ID,
  CANAL_REVISION_VERIFICACION_ID,
  ROL_STAFF_VERIFICACION_ID,
  ROL_NO_VERIFICADO_ID,
  ROL_VERIFICADO_ID,
  PREGUNTAS,
};
