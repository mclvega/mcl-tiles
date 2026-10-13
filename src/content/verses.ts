import datos from '../data/versiculos.json';
import { permutation } from '../core/rng';

export interface Versiculo {
  id: number;
  ref: string;
  texto: string;
  /** Fichas relacionadas (ids del catálogo). */
  tags: string[];
}

export const VERSICULOS: Versiculo[] = datos;
export const VERSICULOS_POR_ID = new Map(VERSICULOS.map((v) => [v.id, v]));

export const CREDITO_RVR1960 =
  'Texto bíblico: Reina-Valera 1960® © Sociedades Bíblicas en América Latina, 1960. Renovado © Sociedades Bíblicas Unidas, 1988. Utilizado con permiso.';

/** Los niveles del tutorial tienen versículos fijos. */
const FIJOS: Record<number, number> = { 1: 1, 2: 2, 3: 3 };

/**
 * Versículo del nivel n. Se recorre una permutación del pool por ciclo, así
 * no se repite hasta agotar el pool, y el juego puede seguir para siempre.
 */
export function versiculoDeNivel(n: number): Versiculo {
  if (FIJOS[n]) return VERSICULOS_POR_ID.get(FIJOS[n])!;
  const total = VERSICULOS.length;
  const i = n - 4;
  const ciclo = Math.floor(i / total);
  const orden = permutation(total, `versiculos:${ciclo}`);
  return VERSICULOS[orden[i % total]];
}

/** Ficha protagonista del nivel según el versículo (si está disponible). */
export function protagonistaDe(v: Versiculo, pool: string[]): string | null {
  return v.tags.find((t) => pool.includes(t)) ?? null;
}

export function claveDia(fecha = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function numeroDia(fecha = new Date()): number {
  return Math.floor(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()) / 86400000);
}

export function versiculoDelDia(fecha = new Date()): Versiculo {
  const total = VERSICULOS.length;
  const dia = numeroDia(fecha);
  const orden = permutation(total, `dia:${Math.floor(dia / total)}`);
  return VERSICULOS[orden[dia % total]];
}

/** "Salmos 121:1-2" → "Salmos 121". */
export function capitulo(ref: string): string {
  return ref.replace(/:.*$/, '');
}


/** Para mostrar: primera letra en mayúscula (algunos versículos continúan una frase). */
export function textoVisible(v: Versiculo): string {
  return v.texto.charAt(0).toLocaleUpperCase('es') + v.texto.slice(1);
}
