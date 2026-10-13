import { type ParamsNivel } from '../core/difficulty';
import { type Guardado } from '../storage';
import { AYUDAS, ARTICULOS_POR_ID, type IdAyuda } from './shop';

/** Premios en talentos (Mateo 25: la parábola de los talentos). */
export const PREMIOS = {
  /** Pregunta bonus opcional al completar un nivel. */
  bonus: { acierto: 10, error: 3 },
  /** Quiz bíblico automático cada 2 o 3 niveles. */
  quiz: { acierto: 20, error: 5 },
  preguntaDia: { acierto: 50, error: 25 },
  ganaTalentos: { acierto: 10, error: 5, maximoDiario: 5 },
};

/** El quiz aparece alternando cada 2 y 3 niveles (tras los niveles 2, 5, 7, 10, 12…). */
export function tocaQuiz(nivel: number): boolean {
  return nivel % 5 === 2 || nivel % 5 === 0;
}

export function premioNivel(p: ParamsNivel, estrellas: number): number {
  return Math.round((10 + 5 * estrellas) * p.premioMult);
}

export function sumarTalentos(g: Guardado, cantidad: number): void {
  g.talentos = Math.max(0, g.talentos + Math.round(cantidad));
}

export function gastarTalentos(g: Guardado, cantidad: number): boolean {
  if (cantidad < 0 || g.talentos < cantidad) return false;
  g.talentos -= cantidad;
  return true;
}

export type ResultadoCompra = 'ok' | 'sinTalentos' | 'yaComprado' | 'noExiste';

export function comprarAyuda(g: Guardado, id: IdAyuda): ResultadoCompra {
  if (!gastarTalentos(g, AYUDAS[id].precio)) return 'sinTalentos';
  g.ayudas[id]++;
  return 'ok';
}

export function comprarArticulo(g: Guardado, id: string): ResultadoCompra {
  const articulo = ARTICULOS_POR_ID.get(id);
  if (!articulo) return 'noExiste';
  if (g.compras.includes(id)) return 'yaComprado';
  if (!gastarTalentos(g, articulo.precio)) return 'sinTalentos';
  g.compras.push(id);
  return 'ok';
}

export function ayudaAlAzar(azar: number): IdAyuda {
  const ids = Object.keys(AYUDAS) as IdAyuda[];
  return ids[Math.min(ids.length - 1, Math.floor(azar * ids.length))];
}

export function puedePreguntaDelDia(g: Guardado, hoy: string): boolean {
  return g.preguntaDia !== hoy;
}

/** Registra la pregunta del día y actualiza la racha de días seguidos. */
export function registrarPreguntaDelDia(g: Guardado, hoy: string, ayer: string): void {
  g.preguntaDia = hoy;
  g.racha.dias = g.racha.ultima === ayer ? g.racha.dias + 1 : 1;
  g.racha.ultima = hoy;
}

export function ganaTalentosRestantes(g: Guardado, hoy: string): number {
  const usadas = g.ganaHoy.fecha === hoy ? g.ganaHoy.veces : 0;
  return Math.max(0, PREMIOS.ganaTalentos.maximoDiario - usadas);
}

export function registrarGanaTalentos(g: Guardado, hoy: string): void {
  if (g.ganaHoy.fecha !== hoy) g.ganaHoy = { fecha: hoy, veces: 0 };
  g.ganaHoy.veces++;
}
