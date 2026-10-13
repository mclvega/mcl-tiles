import { randInt, rngFrom } from './rng';

export type Dificultad = 'muyFacil' | 'facil' | 'normal' | 'desafio';

export interface ModoDificultad {
  nombre: string;
  bandeja: number;
  multiplicador: number;
  capasMax: number;
  ayudasGratis: number;
  premio: number;
}

export const MODOS: Record<Dificultad, ModoDificultad> = {
  muyFacil: { nombre: 'Muy fácil', bandeja: 8, multiplicador: 0.6, capasMax: 2, ayudasGratis: 3, premio: 1 },
  facil: { nombre: 'Fácil', bandeja: 8, multiplicador: 0.8, capasMax: 3, ayudasGratis: 2, premio: 1 },
  normal: { nombre: 'Normal', bandeja: 7, multiplicador: 1, capasMax: 4, ayudasGratis: 1, premio: 1.2 },
  desafio: { nombre: 'Desafío', bandeja: 7, multiplicador: 1.2, capasMax: 5, ayudasGratis: 0, premio: 1.5 },
};

export type TipoNivel = 'tutorial' | 'descanso' | 'especial' | 'normal';

export interface ParamsNivel {
  nivel: number;
  dificultad: Dificultad;
  masFacil: boolean;
  fichas: number;
  tipos: number;
  capas: number;
  ventana: number;
  margen: number;
  bandeja: number;
  tipoNivel: TipoNivel;
  premioMult: number;
  ayudasGratis: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Redondea al múltiplo de 3 más cercano, con un mínimo de 9 fichas. */
export function multiploDe3(v: number): number {
  return Math.max(9, Math.round(v / 3) * 3);
}

export function tipoDeNivel(n: number): TipoNivel {
  if (n <= 3) return 'tutorial';
  if (n % 10 === 0) return 'especial';
  if (n % 5 === 0) return 'descanso';
  return 'normal';
}

/**
 * Parámetros del nivel n. La curva sube despacio hasta el nivel ~150 y
 * después varía dentro de un techo amable, de modo que el juego es infinito
 * sin volverse imposible.
 */
export function paramsNivel(n: number, dificultad: Dificultad = 'normal', masFacil = false): ParamsNivel {
  const modo = MODOS[dificultad];
  const tipoNivel = tipoDeNivel(n);
  const rng = rngFrom(`params:${n}`);
  let fichas: number;
  let tipos: number;
  let capas: number;
  let ventana: number;
  let margen: number;

  if (n === 1) {
    [fichas, tipos, capas, ventana, margen] = [9, 3, 1, 1, 4];
  } else if (n === 2) {
    [fichas, tipos, capas, ventana, margen] = [12, 4, 1, 1, 4];
  } else if (n === 3) {
    [fichas, tipos, capas, ventana, margen] = [18, 4, 2, 1, 4];
  } else {
    const t = Math.pow(clamp((n - 4) / 146, 0, 1), 0.85);
    fichas = randInt(rng, Math.round(lerp(21, 45, t)), Math.round(lerp(27, 75, t)));
    tipos = randInt(rng, Math.round(lerp(4, 7, t)), Math.round(lerp(5, 10, t)));
    capas = randInt(rng, Math.round(lerp(1, 2, t)), Math.round(lerp(2, 4, t)));
    ventana = n < 10 ? 1 : randInt(rng, Math.floor(lerp(1.6, 2, t)), Math.round(lerp(2, 3, t)));
    margen = n < 10 ? 4 : n < 30 ? 3 : 2;

    if (tipoNivel === 'especial') {
      fichas *= 1.25;
    } else if (tipoNivel === 'descanso') {
      fichas *= 0.7;
      tipos -= 1;
      ventana = 1;
    }
    fichas *= modo.multiplicador;
    tipos = Math.round(tipos * modo.multiplicador);
  }

  if (masFacil) {
    fichas *= 0.7;
    tipos -= 2;
    ventana = 1;
    capas -= 1;
  }

  fichas = multiploDe3(fichas);
  tipos = clamp(Math.round(tipos), 3, Math.floor(fichas / 3));
  capas = clamp(Math.round(capas), 1, modo.capasMax);

  return {
    nivel: n,
    dificultad,
    masFacil,
    fichas,
    tipos,
    capas,
    ventana: Math.max(1, ventana),
    margen,
    bandeja: modo.bandeja,
    tipoNivel,
    premioMult: modo.premio * (tipoNivel === 'especial' ? 2 : 1),
    ayudasGratis: modo.ayudasGratis,
  };
}
