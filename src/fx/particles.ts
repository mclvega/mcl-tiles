/** Partículas dibujadas en el lienzo de efectos: destellos, confeti y palomas. */
export interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  vidaMax: number;
  tam: number;
  color: string;
  giro: number;
  vgiro: number;
  tipo: 'destello' | 'confeti' | 'paloma';
}

const COLORES_CONFETI = ['#f4c430', '#e74c3c', '#2e86de', '#27ae60', '#8e44ad', '#ff9f1a'];

export function crearDestellos(x: number, y: number, cantidad: number, color = '#ffd43b'): Particula[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const angulo = (i / cantidad) * Math.PI * 2 + Math.random() * 0.4;
    const rapidez = 90 + Math.random() * 140;
    return {
      x,
      y,
      vx: Math.cos(angulo) * rapidez,
      vy: Math.sin(angulo) * rapidez,
      vida: 0,
      vidaMax: 0.6 + Math.random() * 0.35,
      tam: 5 + Math.random() * 6,
      color,
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 8,
      tipo: 'destello',
    };
  });
}

export function crearConfeti(ancho: number, cantidad: number): Particula[] {
  return Array.from({ length: cantidad }, () => ({
    x: Math.random() * ancho,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 80,
    vy: 120 + Math.random() * 160,
    vida: 0,
    vidaMax: 3 + Math.random() * 1.5,
    tam: 7 + Math.random() * 7,
    color: COLORES_CONFETI[Math.floor(Math.random() * COLORES_CONFETI.length)],
    giro: Math.random() * Math.PI,
    vgiro: (Math.random() - 0.5) * 10,
    tipo: 'confeti',
  }));
}

export function crearPalomas(ancho: number, alto: number, cantidad: number): Particula[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    x: ancho * (0.15 + (0.7 * i) / Math.max(1, cantidad - 1)) + (Math.random() - 0.5) * 60,
    y: alto + 40 + Math.random() * 80,
    vx: (Math.random() - 0.3) * 50,
    vy: -(110 + Math.random() * 60),
    vida: 0,
    vidaMax: 5,
    tam: 26 + Math.random() * 12,
    color: '#ffffff',
    giro: Math.random() * Math.PI * 2,
    vgiro: 9 + Math.random() * 3,
    tipo: 'paloma',
  }));
}

export function actualizar(p: Particula, dt: number): boolean {
  p.vida += dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.giro += p.vgiro * dt;
  if (p.tipo === 'destello') {
    p.vx *= 0.92;
    p.vy *= 0.92;
  } else if (p.tipo === 'confeti') {
    p.vx += Math.sin(p.giro) * 6;
  }
  return p.vida < p.vidaMax;
}

export function dibujar(ctx: CanvasRenderingContext2D, p: Particula): void {
  const alfa = Math.max(0, 1 - p.vida / p.vidaMax);
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.tipo === 'destello') {
    ctx.globalAlpha = alfa;
    ctx.rotate(p.giro);
    ctx.fillStyle = p.color;
    const r = p.tam * (0.6 + alfa * 0.4);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const radio = i % 2 === 0 ? r : r * 0.35;
      const a = (i / 8) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * radio, Math.sin(a) * radio);
    }
    ctx.closePath();
    ctx.fill();
  } else if (p.tipo === 'confeti') {
    ctx.globalAlpha = Math.min(1, alfa * 2);
    ctx.rotate(p.giro);
    ctx.scale(1, Math.abs(Math.cos(p.giro * 1.3)) + 0.2);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2);
  } else {
    // Paloma: cuerpo y alas que aletean.
    ctx.globalAlpha = Math.min(1, alfa * 1.5);
    const s = p.tam;
    const aleteo = Math.sin(p.giro) * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = 'rgba(40, 60, 90, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.42, s * 0.18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const lado of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.05, 0);
      ctx.quadraticCurveTo(lado * s * 0.25, -s * (0.55 + aleteo * lado * 0.2), lado * s * 0.6, -s * (0.25 + aleteo));
      ctx.quadraticCurveTo(lado * s * 0.3, -s * 0.05, s * 0.1, 0);
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(s * 0.38, -s * 0.12, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
