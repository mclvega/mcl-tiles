/**
 * «Disparador de burbujas»: lógica pura, sin DOM.
 * Rejilla en panal: las filas impares están corridas media burbuja y tienen
 * una columna menos. Coordenadas en unidades de radio (r = 1).
 */
import { type Rng } from './rng';

export const COLUMNAS = 9;
/** Filas máximas: si una burbuja queda en la última, se pierde. */
export const FILAS = 13;
const ALTO_FILA = Math.sqrt(3);

export interface TableroBurbujas {
  /** filas[f][c] = color o null. Las filas impares tienen COLUMNAS-1 celdas. */
  filas: Array<Array<number | null>>;
  colores: number;
}

export interface Celda {
  f: number;
  c: number;
}

export const columnasDeFila = (f: number) => (f % 2 === 0 ? COLUMNAS : COLUMNAS - 1);
export const anchoTablero = () => COLUMNAS * 2;

/** Centro de una celda, en unidades de radio. */
export function centro(f: number, c: number): { x: number; y: number } {
  return { x: 1 + c * 2 + (f % 2 === 1 ? 1 : 0), y: 1 + f * ALTO_FILA };
}

export function crearTablero(filasIniciales: number, colores: number, rng: Rng): TableroBurbujas {
  const filas: Array<Array<number | null>> = [];
  for (let f = 0; f < FILAS; f++) {
    filas.push(Array.from({ length: columnasDeFila(f) }, () => (f < filasIniciales ? Math.floor(rng() * colores) : null)));
  }
  return { filas, colores };
}

export function vecinos(f: number, c: number): Celda[] {
  const corrida = f % 2 === 1;
  const candidatos: Array<[number, number]> = [
    [f, c - 1],
    [f, c + 1],
    [f - 1, corrida ? c : c - 1],
    [f - 1, corrida ? c + 1 : c],
    [f + 1, corrida ? c : c - 1],
    [f + 1, corrida ? c + 1 : c],
  ];
  return candidatos
    .filter(([ff, cc]) => ff >= 0 && ff < FILAS && cc >= 0 && cc < columnasDeFila(ff))
    .map(([ff, cc]) => ({ f: ff, c: cc }));
}

const ocupada = (t: TableroBurbujas, f: number, c: number) => t.filas[f]?.[c] !== null && t.filas[f]?.[c] !== undefined;

/** Grupo conectado del mismo color que la celda dada. */
export function grupoMismoColor(t: TableroBurbujas, inicio: Celda): Celda[] {
  const color = t.filas[inicio.f][inicio.c];
  if (color === null) return [];
  const visto = new Set<string>([`${inicio.f},${inicio.c}`]);
  const pila = [inicio];
  const grupo: Celda[] = [];
  while (pila.length) {
    const actual = pila.pop()!;
    grupo.push(actual);
    for (const v of vecinos(actual.f, actual.c)) {
      const k = `${v.f},${v.c}`;
      if (!visto.has(k) && t.filas[v.f][v.c] === color) {
        visto.add(k);
        pila.push(v);
      }
    }
  }
  return grupo;
}

/** Burbujas que no están conectadas al techo (caen). */
export function colgantes(t: TableroBurbujas): Celda[] {
  const conectado = new Set<string>();
  const pila: Celda[] = [];
  for (let c = 0; c < columnasDeFila(0); c++) {
    if (ocupada(t, 0, c)) {
      conectado.add(`0,${c}`);
      pila.push({ f: 0, c });
    }
  }
  while (pila.length) {
    const actual = pila.pop()!;
    for (const v of vecinos(actual.f, actual.c)) {
      const k = `${v.f},${v.c}`;
      if (!conectado.has(k) && ocupada(t, v.f, v.c)) {
        conectado.add(k);
        pila.push(v);
      }
    }
  }
  const res: Celda[] = [];
  t.filas.forEach((fila, f) => fila.forEach((col, c) => col !== null && !conectado.has(`${f},${c}`) && res.push({ f, c })));
  return res;
}

export function coloresRestantes(t: TableroBurbujas): number[] {
  return [...new Set(t.filas.flat().filter((x): x is number => x !== null))].sort();
}

export function vacio(t: TableroBurbujas): boolean {
  return t.filas.every((fila) => fila.every((x) => x === null));
}

export interface Trayectoria {
  /** Puntos del recorrido (inicio, rebotes y final), en unidades de radio. */
  puntos: Array<{ x: number; y: number }>;
  celda: Celda | null;
}

/**
 * Simula el disparo desde (x0, y0) con el ángulo dado (radianes; -π/2 es hacia
 * arriba). Rebota en las paredes y se detiene al tocar el techo u otra burbuja.
 */
export function trayectoria(t: TableroBurbujas, x0: number, y0: number, angulo: number): Trayectoria {
  let x = x0;
  let y = y0;
  let dx = Math.cos(angulo);
  const dy = Math.sin(angulo);
  const puntos = [{ x, y }];
  const ancho = anchoTablero();
  const paso = 0.1;
  for (let i = 0; i < 4000; i++) {
    x += dx * paso;
    y += dy * paso;
    if (x < 1) {
      x = 2 - x;
      dx = -dx;
      puntos.push({ x: 1, y });
    } else if (x > ancho - 1) {
      x = 2 * (ancho - 1) - x;
      dx = -dx;
      puntos.push({ x: ancho - 1, y });
    }
    let choca = y <= 1;
    if (!choca) {
      for (let f = 0; f < FILAS && !choca; f++) {
        for (let c = 0; c < columnasDeFila(f); c++) {
          if (t.filas[f][c] === null) continue;
          const p = centro(f, c);
          if ((p.x - x) ** 2 + (p.y - y) ** 2 < 1.75 ** 2) {
            choca = true;
            break;
          }
        }
      }
    }
    if (choca) {
      puntos.push({ x, y });
      return { puntos, celda: encajar(t, x, y) };
    }
  }
  return { puntos, celda: null };
}

/** Celda libre más cercana a la posición (donde se queda la burbuja disparada). */
export function encajar(t: TableroBurbujas, x: number, y: number): Celda | null {
  let mejor: Celda | null = null;
  let distancia = Infinity;
  for (let f = 0; f < FILAS; f++) {
    for (let c = 0; c < columnasDeFila(f); c++) {
      if (t.filas[f][c] !== null) continue;
      // Debe tocar el techo o a otra burbuja para poder quedarse ahí.
      const apoyada = f === 0 || vecinos(f, c).some((v) => ocupada(t, v.f, v.c));
      if (!apoyada) continue;
      const p = centro(f, c);
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < distancia) {
        distancia = d;
        mejor = { f, c };
      }
    }
  }
  return mejor;
}

export interface ResultadoDisparo {
  celda: Celda;
  reventadas: Celda[];
  /** Burbujas que caen, con su color (para animarlas). */
  caidas: Array<Celda & { color: number }>;
  /** La burbuja quedó en la última fila (se pierde). */
  tocaFondo: boolean;
}

/** Coloca la burbuja y resuelve explosiones y caídas. */
export function colocar(t: TableroBurbujas, celda: Celda, color: number): ResultadoDisparo {
  t.filas[celda.f][celda.c] = color;
  const grupo = grupoMismoColor(t, celda);
  let reventadas: Celda[] = [];
  let caidas: Array<Celda & { color: number }> = [];
  if (grupo.length >= 3) {
    reventadas = grupo;
    for (const g of grupo) t.filas[g.f][g.c] = null;
    caidas = colgantes(t).map((g) => ({ ...g, color: t.filas[g.f][g.c]! }));
    for (const g of caidas) t.filas[g.f][g.c] = null;
  }
  const tocaFondo = t.filas[FILAS - 1].some((x) => x !== null);
  return { celda, reventadas, caidas, tocaFondo };
}

/** Color para el lanzador: solo entre los que quedan en el tablero. */
export function colorParaLanzar(t: TableroBurbujas, rng: Rng): number {
  const quedan = coloresRestantes(t);
  if (!quedan.length) return Math.floor(rng() * t.colores);
  return quedan[Math.floor(rng() * quedan.length)];
}

/** Parámetros del nivel: filas iniciales, colores y disparos (generosos). */
export function paramsBurbujas(n: number, dificultad: string, reto: boolean): { filas: number; colores: number; disparos: number } {
  const colores = dificultad === 'desafio' ? 5 : 4;
  const filas = Math.min(7, 4 + Math.floor(n / 40) + (reto ? 1 : 0));
  const extra = dificultad === 'muyFacil' ? 14 : dificultad === 'facil' ? 10 : dificultad === 'desafio' ? 2 : 6;
  return { filas, colores, disparos: 20 + filas * 2 + extra };
}
