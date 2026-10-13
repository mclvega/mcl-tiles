import datos from '../data/preguntas.json';
import datosAnimales from '../data/preguntas-animales.json';
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
/** Preguntas fáciles de animalitos, para cuando el contenido bíblico está apagado. */
export const PREGUNTAS_ANIMALES: Pregunta[] = datosAnimales;

/** Pregunta número i del recorrido: no se repite hasta agotar el banco. */
export function preguntaNumero(i: number, biblico = true): Pregunta {
  const banco = biblico ? PREGUNTAS : PREGUNTAS_ANIMALES;
  const total = banco.length;
  const ciclo = Math.floor(i / total);
  const orden = permutation(total, `${biblico ? 'preguntas' : 'animales'}:${ciclo}`);
  return banco[orden[i % total]];
}

export interface OpcionMostrada {
  texto: string;
  correcta: boolean;
}

export function opcionesBarajadas(p: Pregunta, semilla: string): OpcionMostrada[] {
  const opciones = p.opciones.map((texto, i) => ({ texto, correcta: i === p.correcta }));
  return shuffle(rngFrom(`opciones:${p.id}:${semilla}`), opciones);
}
