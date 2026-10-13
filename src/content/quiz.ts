import datos from '../data/preguntas.json';
import { permutation, rngFrom, shuffle } from '../core/rng';

export interface Pregunta {
  id: number;
  pregunta: string;
  opciones: string[];
  /** Índice de la opción correcta en `opciones`. */
  correcta: number;
  ref: string | null;
}

export const PREGUNTAS: Pregunta[] = datos;

/** Pregunta número i del recorrido: no se repite hasta agotar el banco. */
export function preguntaNumero(i: number): Pregunta {
  const total = PREGUNTAS.length;
  const ciclo = Math.floor(i / total);
  const orden = permutation(total, `preguntas:${ciclo}`);
  return PREGUNTAS[orden[i % total]];
}

export interface OpcionMostrada {
  texto: string;
  correcta: boolean;
}

export function opcionesBarajadas(p: Pregunta, semilla: string): OpcionMostrada[] {
  const opciones = p.opciones.map((texto, i) => ({ texto, correcta: i === p.correcta }));
  return shuffle(rngFrom(`opciones:${p.id}:${semilla}`), opciones);
}
