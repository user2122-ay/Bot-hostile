const path = require('node:path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const RUTA_FRENTE = path.join(__dirname, '..', 'assets', 'cedula-frente.png');
const RUTA_ATRAS = path.join(__dirname, '..', 'assets', 'cedula-atras.png');

const COLOR_TEXTO = '#16264d';

function ajustarFuente(ctx, texto, maxWidth, tamanioInicial, fontFamily, estilo) {
  let tamanio = tamanioInicial;
  ctx.font = `${estilo} ${tamanio}px ${fontFamily}`;
  while (ctx.measureText(texto).width > maxWidth && tamanio > 12) {
    tamanio--;
    ctx.font = `${estilo} ${tamanio}px ${fontFamily}`;
  }
}

function dibujarTexto(ctx, texto, x, y, maxWidth, tamanioInicial, opciones = {}) {
  const { align = 'left', fontFamily = 'sans-serif', estilo = 'bold', color = COLOR_TEXTO } = opciones;
  texto = String(texto ?? '');
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ajustarFuente(ctx, texto, maxWidth, tamanioInicial, fontFamily, estilo);
  ctx.fillText(texto, x, y);
}

function dibujarRectRedondeado(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function generarFrente(datos) {
  const plantilla = await loadImage(RUTA_FRENTE);
  const canvas = createCanvas(plantilla.width, plantilla.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(plantilla, 0, 0);

  if (datos.fotoUrl) {
    try {
      const foto = await loadImage(datos.fotoUrl);
      const cajaX = 40, cajaY = 268, cajaW = 335, cajaH = 415, radio = 26;
      ctx.save();
      dibujarRectRedondeado(ctx, cajaX, cajaY, cajaW, cajaH, radio);
      ctx.clip();
      const escala = Math.max(cajaW / foto.width, cajaH / foto.height);
      const anchoDestino = foto.width * escala;
      const altoDestino = foto.height * escala;
      const offsetX = cajaX + (cajaW - anchoDestino) / 2;
      const offsetY = cajaY + (cajaH - altoDestino) / 2;
      ctx.drawImage(foto, offsetX, offsetY, anchoDestino, altoDestino);
      ctx.restore();
    } catch (err) {
      console.error('❌ Error cargando la foto:', err);
    }
  }

  // Coordenadas verificadas pixel por pixel sobre la plantilla real.
  dibujarTexto(ctx, datos.nirp, 1175, 286, 300, 30);
  dibujarTexto(ctx, datos.apellidos?.toUpperCase(), 612, 346, 400, 28);
  dibujarTexto(ctx, datos.nombres?.toUpperCase(), 600, 410, 400, 28);
  dibujarTexto(ctx, datos.nacionalidad?.toUpperCase(), 647, 472, 400, 28);
  dibujarTexto(ctx, datos.sexo?.toUpperCase(), 591, 538, 140, 26, { align: 'center' });
  dibujarTexto(ctx, datos.tipoSangre?.toUpperCase(), 1136, 539, 90, 26, { align: 'center' });
  dibujarTexto(ctx, datos.fechaNacimiento, 723, 597, 310, 26);
  dibujarTexto(ctx, datos.lugarExpedicion?.toUpperCase(), 723, 659, 380, 26);
  dibujarTexto(ctx, datos.fechaExpedicion, 570, 787, 300, 24);
  dibujarTexto(ctx, `${datos.nombres ?? ''} ${datos.apellidos ?? ''}`, 1064, 864, 380, 26, {
    align: 'center',
    estilo: 'italic',
  });

  return canvas.encode('png');
}

async function generarAtras(datos) {
  const plantilla = await loadImage(RUTA_ATRAS);
  const canvas = createCanvas(plantilla.width, plantilla.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(plantilla, 0, 0);

  dibujarTexto(ctx, datos.lugarNacimiento?.toUpperCase(), 95, 188, 700, 30);
  dibujarTexto(ctx, datos.fechaNacimiento, 95, 303, 700, 30);

  return canvas.encode('png');
}

module.exports = { generarFrente, generarAtras };
