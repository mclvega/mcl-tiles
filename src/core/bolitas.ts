/**
 * Minijuego «Bolitas de colores» (combinar 3, estilo candy): se intercambian
 * dos bolitas vecinas y las líneas de 3 o más del mismo color desaparecen.
 * Lógica pura, sin DOM.
 */
import { type Rng } from './rng';

export interface Bola {
  id: number;
  color: number;
}

export interface TableroBolitas {
  ancho: number;
  alto: number;
  colores: number;
  celdas: Array<Bola | null>;
  siguienteId: number;
}

export interface PasoCascada {
  eliminadas: Bola[];
  nuevas: Bola[];
}

const idx = (t: TableroBolitas, x: number, y: number) => y * t.ancho + x;

function nuevaBola(t: TableroBolitas, rng: Rng): Bola {
  return { id: t.siguienteId++, color: Math.floor(rng() * t.colores) };
}

/** Crea un tablero sin combinaciones iniciales y con al menos un movimiento posible. */
export function crearTablero(ancho: number, alto: number, colores: number, rng: Rng): TableroBolitas {
  const t: TableroBolitas = { ancho, alto, colores, celdas: [], siguienteId: 1 };
  do {
    t.celdas = [];
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        let b: Bola;
        do {
          b = nuevaBola(t, rng);
        } while (
          (x >= 2 && t.celdas[idx(t, x - 1, y)]!.color === b.color && t.celdas[idx(t, x - 2, y)]!.color === b.color) ||
          (y >= 2 && t.celdas[idx(t, x, y - 1)]!.color === b.color && t.celdas[idx(t, x, y - 2)]!.color === b.color)
        );
        t.celdas.push(b);
      }
    }
  } while (!pista(t));
  return t;
}

export function sonVecinas(t: TableroBolitas, a: number, b: number): boolean {
  const ax = a % t.ancho;
  const bx = b % t.ancho;
  return (Math.abs(a - b) === 1 && Math.floor(a / t.ancho) === Math.floor(b / t.ancho)) || (Math.abs(a - b) === t.ancho && ax === bx);
}

/** Índices que forman líneas de 3 o más del mismo color. */
export function buscarCombinaciones(t: TableroBolitas): Set<number> {
  const res = new Set<number>();
  const revisar = (indices: number[]) => {
    let inicio = 0;
    for (let i = 1; i <= indices.length; i++) {
      const actual = i < indices.length ? t.celdas[indices[i]]?.color : undefined;
      const previo = t.celdas[indices[inicio]]?.color;
      if (actual === undefined || actual !== previo) {
        if (previo !== undefined && i - inicio >= 3) for (let k = inicio; k < i; k++) res.add(indices[k]);
        inicio = i;
      }
    }
  };
  for (let y = 0; y < t.alto; y++) revisar(Array.from({ length: t.ancho }, (_, x) => idx(t, x, y)));
  for (let x = 0; x < t.ancho; x++) revisar(Array.from({ length: t.alto }, (_, y) => idx(t, x, y)));
  return res;
}

export function intercambiar(t: TableroBolitas, a: number, b: number): void {
  [t.celdas[a], t.celdas[b]] = [t.celdas[b], t.celdas[a]];
}

/** Intercambia si forma una combinación; si no, deja todo como estaba. */
export function intentarMovimiento(t: TableroBolitas, a: number, b: number): boolean {
  if (!sonVecinas(t, a, b)) return false;
  intercambiar(t, a, b);
  if (buscarCombinaciones(t).size > 0) return true;
  intercambiar(t, a, b);
  return false;
}

/** Un paso de cascada: quita combinaciones, deja caer y rellena. Devuelve null si no hay nada que quitar. */
export function pasoCascada(t: TableroBolitas, rng: Rng): PasoCascada | null {
  const combinadas = buscarCombinaciones(t);
  if (!combinadas.size) return null;
  const eliminadas: Bola[] = [];
  for (const i of combinadas) {
    eliminadas.push(t.celdas[i]!);
    t.celdas[i] = null;
  }
  const nuevas: Bola[] = [];
  for (let x = 0; x < t.ancho; x++) {
    const columna: Bola[] = [];
    for (let y = t.alto - 1; y >= 0; y--) {
      const b = t.celdas[idx(t, x, y)];
      if (b) columna.push(b);
    }
    for (let y = t.alto - 1, k = 0; y >= 0; y--, k++) {
      if (k < columna.length) t.celdas[idx(t, x, y)] = columna[k];
      else {
        const b = nuevaBola(t, rng);
        nuevas.push(b);
        t.celdas[idx(t, x, y)] = b;
      }
    }
  }
  return { eliminadas, nuevas };
}

/** Un movimiento que forma combinación, o null si no hay ninguno. */
export function pista(t: TableroBolitas): [number, number] | null {
  for (let i = 0; i < t.celdas.length; i++) {
    for (const j of [i + 1, i + t.ancho]) {
      if (j >= t.celdas.length || !sonVecinas(t, i, j)) continue;
      intercambiar(t, i, j);
      const hay = buscarCombinaciones(t).size > 0;
      intercambiar(t, i, j);
      if (hay) return [i, j];
    }
  }
  return null;
}

/** Mezcla hasta que no haya combinaciones sueltas y exista al menos un movimiento. */
export function mezclar(t: TableroBolitas, rng: Rng): void {
  for (let intento = 0; intento < 200; intento++) {
    for (let i = t.celdas.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      intercambiar(t, i, j);
    }
    if (buscarCombinaciones(t).size === 0 && pista(t)) return;
  }
  const nuevo = crearTablero(t.ancho, t.alto, t.colores, rng);
  t.celdas = nuevo.celdas.map((b) => (b ? { id: t.siguienteId++, color: b.color } : null));
}

export interface ObjetivoBolitas {
  color: number;
  cantidad: number;
}

/** Parámetros del nivel de bolitas: tablero, colores, objetivos y movimientos (generosos). */
export function paramsBolitas(n: number, dificultad: string, rng: Rng, reto = false): { colores: number; objetivos: ObjetivoBolitas[]; movimientos: number } {
  const colores = dificultad === 'muyFacil' || dificultad === 'facil' ? 4 : 5;
  // En el nivel reto hay que juntar algunas bolitas más.
  const base = Math.min(28, 10 + Math.floor(n / 15) + (reto ? 4 : 0));
  const elegidos: number[] = [];
  while (elegidos.length < 2) {
    const c = Math.floor(rng() * colores);
    if (!elegidos.includes(c)) elegidos.push(c);
  }
  const extra = dificultad === 'muyFacil' ? 10 : dificultad === 'facil' ? 6 : dificultad === 'desafio' ? -3 : 2;
  return {
    colores,
    objetivos: elegidos.map((color) => ({ color, cantidad: base })),
    movimientos: Math.max(14, Math.round(base * 1.1) + extra),
  };
}
