async function obtenerTodosLosMensajes(canal) {
  let mensajes = [];
  let ultimoId;

  while (true) {
    const opciones = { limit: 100 };
    if (ultimoId) opciones.before = ultimoId;
    const lote = await canal.messages.fetch(opciones);
    if (lote.size === 0) break;
    mensajes = mensajes.concat(Array.from(lote.values()));
    ultimoId = lote.last().id;
    if (lote.size < 100) break;
  }

  return mensajes;
}

async function generarTranscripcionHTML(canal) {
  const mensajes = await obtenerTodosLosMensajes(canal);

  const filas = mensajes
    .reverse()
    .map((m) => {
      const fecha = m.createdAt.toLocaleString('es-CO');
      const autor = m.author.tag.replace(/</g, '&lt;');
      const contenido = (m.content || '(sin contenido de texto)')
        .replace(/</g, '&lt;')
        .replace(/\n/g, '<br>');
      return `<div class="mensaje"><span class="autor">${autor}</span> <span class="fecha">${fecha}</span><div class="contenido">${contenido}</div></div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Transcripción — ${canal.name}</title>
<style>
  body { background:#2b2d31; color:#dbdee1; font-family: sans-serif; padding: 20px; }
  .mensaje { border-bottom: 1px solid #40444b; padding: 10px 0; }
  .autor { font-weight: bold; color: #fff; }
  .fecha { color: #949ba4; font-size: 12px; margin-left: 8px; }
  .contenido { margin-top: 4px; white-space: pre-wrap; }
</style>
</head>
<body>
<h1>Transcripción de #${canal.name}</h1>
${filas}
</body>
</html>`;
}

module.exports = { generarTranscripcionHTML };
