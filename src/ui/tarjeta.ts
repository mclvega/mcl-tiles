import { CREDITO_RVR1960, textoVisible, type Versiculo } from '../content/verses';

interface EstiloTarjeta {
  fondo: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  texto: string;
  ref: string;
  suave: string;
}

const ESTILOS: Record<string, EstiloTarjeta> = {
  sencilla: {
    fondo: (ctx, w, h) => {
      ctx.fillStyle = '#fffaf0';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d9b44a';
      ctx.lineWidth = 14;
      ctx.strokeRect(40, 40, w - 80, h - 80);
    },
    texto: '#2b2118',
    ref: '#8a5a00',
    suave: '#6b5a45',
  },
  pergamino: {
    fondo: (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 100, w / 2, h / 2, w * 0.8);
      g.addColorStop(0, '#f8ecd0');
      g.addColorStop(1, '#d9b98a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#7a4f2a';
      ctx.lineWidth = 10;
      ctx.strokeRect(50, 50, w - 100, h - 100);
      ctx.lineWidth = 3;
      ctx.strokeRect(72, 72, w - 144, h - 144);
    },
    texto: '#3b2410',
    ref: '#7a3b12',
    suave: '#5e4024',
  },
  olivo: {
    fondo: (ctx, w, h) => {
      ctx.fillStyle = '#f4f9ee';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#6a994e';
      ctx.lineWidth = 12;
      ctx.strokeRect(40, 40, w - 80, h - 80);
      ctx.fillStyle = '#6a994e';
      for (let i = 0; i < 9; i++) {
        for (const [x, y, rot] of [
          [90 + i * 110, 70, 0.5],
          [90 + i * 110, h - 70, -0.5],
        ] as const) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, 30, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    },
    texto: '#22331a',
    ref: '#3f6b2a',
    suave: '#4c5f43',
  },
  cielo: {
    fondo: (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0f2547');
      g.addColorStop(1, '#2c4f86');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) {
        const x = (i * 397) % w;
        const y = (i * 211) % h;
        ctx.globalAlpha = 0.25 + ((i * 37) % 60) / 100;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    texto: '#ffffff',
    ref: '#ffd43b',
    suave: '#cfdcf2',
  },
};

function partirLineas(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > ancho && actual) {
      lineas.push(actual);
      actual = p;
    } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Dibuja la tarjeta del versículo (1080x1350) y la descarga como imagen PNG. */
export async function descargarTarjeta(v: Versiculo, estilo: string, nombre: string): Promise<void> {
  const w = 1080;
  const h = 1350;
  const lienzo = document.createElement('canvas');
  lienzo.width = w;
  lienzo.height = h;
  const ctx = lienzo.getContext('2d');
  if (!ctx) return;
  try {
    await document.fonts?.ready;
  } catch {
    // Sin la API de fuentes se usa la fuente del sistema.
  }
  const e = ESTILOS[estilo] ?? ESTILOS.sencilla;
  e.fondo(ctx, w, h);
  const fuente = "'Atkinson Hyperlegible', 'Segoe UI', sans-serif";

  let tam = 58;
  let lineas: string[] = [];
  const texto = `«${textoVisible(v)}»`;
  do {
    ctx.font = `italic ${tam}px ${fuente}`;
    lineas = partirLineas(ctx, texto, w - 240);
    tam -= 3;
  } while (lineas.length * tam * 1.4 > h - 520 && tam > 30);
  const alto = lineas.length * (tam + 3) * 1.4;
  let y = (h - alto) / 2 - 20;

  ctx.textAlign = 'center';
  ctx.fillStyle = e.suave;
  ctx.font = `700 40px ${fuente}`;
  ctx.fillText('McL Tiles', w / 2, 170);

  ctx.fillStyle = e.texto;
  ctx.font = `italic ${tam + 3}px ${fuente}`;
  for (const linea of lineas) {
    y += (tam + 3) * 1.4;
    ctx.fillText(linea, w / 2, y);
  }
  ctx.fillStyle = e.ref;
  ctx.font = `700 50px ${fuente}`;
  ctx.fillText(`${v.ref} (RVR1960)`, w / 2, y + 110);

  ctx.fillStyle = e.suave;
  ctx.font = `30px ${fuente}`;
  ctx.fillText(`Compartido por ${nombre}`, w / 2, h - 190);
  ctx.font = `20px ${fuente}`;
  partirLineas(ctx, CREDITO_RVR1960, w - 200).forEach((l, i) => ctx.fillText(l, w / 2, h - 130 + i * 28));

  const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `versiculo-${v.ref.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.png`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
