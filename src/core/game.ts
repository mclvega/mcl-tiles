import { type Tablero } from './generator';
import { resolver } from './solver';
import { shuffle, type Rng } from './rng';

export type EstadoPartida = 'jugando' | 'ganado' | 'perdido';

export interface ResultadoJugada {
  id: number;
  /** Posición en la bandeja donde quedó la ficha. */
  indice: number;
  /** Ids del trío eliminado, si se formó. */
  trio: number[] | null;
  estado: EstadoPartida;
}

export const BANDEJA_MAXIMA = 9;

/** Estado de una partida: tablero, bandeja y reglas. Sin dependencias del DOM. */
export class Partida {
  readonly tablero: Tablero;
  capacidad: number;
  /** Ids en la bandeja, agrupados por tipo. */
  bandeja: number[] = [];
  enTablero: boolean[];
  estado: EstadoPartida = 'jugando';
  ayudasUsadas = 0;
  segundaOportunidadUsada = false;
  private tapas: number[];
  private historial: number[] = [];
  /** Orden de llegada a la bandeja (para devolver las más recientes). */
  private llegada: number[] = [];

  constructor(tablero: Tablero, capacidad: number) {
    this.tablero = tablero;
    this.capacidad = capacidad;
    this.enTablero = tablero.fichas.map(() => true);
    this.tapas = tablero.cubiertaPor.map((l) => l.length);
  }

  tipo(id: number): string {
    return this.tablero.fichas[id].tipo;
  }

  esLibre(id: number): boolean {
    return this.enTablero[id] && this.tapas[id] === 0;
  }

  libres(): number[] {
    return this.tablero.fichas.filter((f) => this.esLibre(f.id)).map((f) => f.id);
  }

  restantesEnTablero(): number {
    return this.enTablero.filter(Boolean).length;
  }

  espaciosLibres(): number {
    return this.capacidad - this.bandeja.length;
  }

  private quitarDelTablero(id: number): void {
    this.enTablero[id] = false;
    for (const d of this.tablero.cubre[id]) this.tapas[d]--;
  }

  private ponerEnTablero(id: number): void {
    this.enTablero[id] = true;
    for (const d of this.tablero.cubre[id]) this.tapas[d]++;
  }

  private insertarEnBandeja(id: number): number {
    const tipo = this.tipo(id);
    let indice = -1;
    for (let i = this.bandeja.length - 1; i >= 0; i--) {
      if (this.tipo(this.bandeja[i]) === tipo) {
        indice = i + 1;
        break;
      }
    }
    if (indice < 0) indice = this.bandeja.length;
    this.bandeja.splice(indice, 0, id);
    this.llegada.push(id);
    return indice;
  }

  private sacarDeBandeja(id: number): void {
    this.bandeja = this.bandeja.filter((b) => b !== id);
    this.llegada = this.llegada.filter((b) => b !== id);
  }

  private actualizarEstado(): EstadoPartida {
    if (this.restantesEnTablero() === 0 && this.bandeja.length === 0) this.estado = 'ganado';
    else if (this.bandeja.length >= this.capacidad) this.estado = 'perdido';
    else this.estado = 'jugando';
    return this.estado;
  }

  elegir(id: number): ResultadoJugada | null {
    if (this.estado !== 'jugando' || !this.esLibre(id)) return null;
    this.quitarDelTablero(id);
    const indice = this.insertarEnBandeja(id);
    this.historial.push(id);
    const tipo = this.tipo(id);
    const iguales = this.bandeja.filter((b) => this.tipo(b) === tipo);
    let trio: number[] | null = null;
    if (iguales.length >= 3) {
      trio = iguales.slice(0, 3);
      for (const t of trio) this.sacarDeBandeja(t);
    }
    return { id, indice, trio, estado: this.actualizarEstado() };
  }

  /** "Volver al camino": devuelve al tablero la última ficha si sigue en la bandeja. */
  puedeDeshacer(): boolean {
    const ultima = this.historial[this.historial.length - 1];
    return ultima !== undefined && this.bandeja.includes(ultima);
  }

  deshacer(): number | null {
    if (!this.puedeDeshacer()) return null;
    const id = this.historial.pop()!;
    this.sacarDeBandeja(id);
    this.ponerEnTablero(id);
    this.actualizarEstado();
    return id;
  }

  /** Segunda oportunidad: devuelve al tablero las fichas más recientes de la bandeja. */
  devolverRecientes(cantidad: number): number[] {
    const devueltas: number[] = [];
    while (devueltas.length < cantidad && this.llegada.length) {
      const id = this.llegada[this.llegada.length - 1];
      this.sacarDeBandeja(id);
      this.ponerEnTablero(id);
      this.historial = this.historial.filter((h) => h !== id);
      devueltas.push(id);
    }
    this.actualizarEstado();
    return devueltas;
  }

  /** "Ensancha tu tienda": un espacio más en la bandeja durante este nivel. */
  puedeAgrandar(): boolean {
    return this.capacidad < BANDEJA_MAXIMA;
  }

  agrandarBandeja(): boolean {
    if (!this.puedeAgrandar()) return false;
    this.capacidad++;
    this.actualizarEstado();
    return true;
  }

  /**
   * "Lámpara": completa un trío automáticamente. Prefiere el tipo que ya está
   * en la bandeja y toma del tablero las fichas que falten (libres primero).
   */
  lampara(): { tipo: string; desdeTablero: number[]; desdeBandeja: number[] } | null {
    if (this.estado !== 'jugando') return null;
    const cuenta = new Map<string, number>();
    for (const b of this.bandeja) cuenta.set(this.tipo(b), (cuenta.get(this.tipo(b)) ?? 0) + 1);
    const enTablero = this.tablero.fichas.filter((f) => this.enTablero[f.id]);
    const disponibles = (tipo: string) => enTablero.filter((f) => f.tipo === tipo).length;

    let tipo: string | null = null;
    const enBandeja = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
    for (const [t, c] of enBandeja) {
      if (disponibles(t) >= 3 - c) {
        tipo = t;
        break;
      }
    }
    if (!tipo) {
      const libres = this.libres();
      const porTipo = new Map<string, number>();
      for (const id of libres) porTipo.set(this.tipo(id), (porTipo.get(this.tipo(id)) ?? 0) + 1);
      const candidatos = [...new Set(enTablero.map((f) => f.tipo))].filter((t) => disponibles(t) >= 3);
      candidatos.sort((a, b) => (porTipo.get(b) ?? 0) - (porTipo.get(a) ?? 0));
      tipo = candidatos[0] ?? null;
    }
    if (!tipo) return null;

    const desdeBandeja = this.bandeja.filter((b) => this.tipo(b) === tipo);
    const faltan = 3 - desdeBandeja.length;
    const delTipo = enTablero
      .filter((f) => f.tipo === tipo)
      .sort((a, b) => Number(this.esLibre(b.id)) - Number(this.esLibre(a.id)) || b.z - a.z);
    const desdeTablero = delTipo.slice(0, faltan).map((f) => f.id);
    for (const id of desdeBandeja) this.sacarDeBandeja(id);
    for (const id of desdeTablero) this.quitarDelTablero(id);
    this.historial = this.historial.filter((h) => !desdeBandeja.includes(h));
    this.actualizarEstado();
    return { tipo, desdeTablero, desdeBandeja };
  }

  /** ¿Se puede ganar desde el estado actual? */
  tieneSolucion(limiteNodos = 20000): boolean {
    return (
      resolver(
        {
          tipos: this.tablero.fichas.map((f) => f.tipo),
          cubiertaPor: this.tablero.cubiertaPor,
          cubre: this.tablero.cubre,
          enTablero: this.enTablero,
          bandeja: this.bandeja.map((b) => this.tipo(b)),
          capacidad: this.capacidad,
        },
        limiteNodos,
      ) !== null
    );
  }

  /**
   * "Viento recio": baraja los tipos de las fichas del tablero, comprobando que
   * el resultado siga teniendo solución. Devuelve false si no encontró una mezcla válida.
   */
  barajar(rng: Rng, intentos = 25): boolean {
    const ids = this.tablero.fichas.filter((f) => this.enTablero[f.id]).map((f) => f.id);
    const originales = ids.map((id) => this.tipo(id));
    for (let i = 0; i < intentos; i++) {
      const mezcla = shuffle(rng, [...originales]);
      ids.forEach((id, k) => (this.tablero.fichas[id].tipo = mezcla[k]));
      if (this.tieneSolucion(6000)) return true;
    }
    ids.forEach((id, k) => (this.tablero.fichas[id].tipo = originales[k]));
    return false;
  }

  /** Fichas libres que forman (o acercan) un trío, para la ayuda automática. */
  pista(): number[] {
    const libres = this.libres();
    const cuenta = new Map<string, number>();
    for (const b of this.bandeja) cuenta.set(this.tipo(b), (cuenta.get(this.tipo(b)) ?? 0) + 1);
    const porTipo = new Map<string, number[]>();
    for (const id of libres) porTipo.set(this.tipo(id), [...(porTipo.get(this.tipo(id)) ?? []), id]);

    let mejor: number[] = [];
    let mejorPuntos = -1;
    for (const [tipo, ids] of porTipo) {
      const enBandeja = cuenta.get(tipo) ?? 0;
      const faltan = 3 - enBandeja;
      const completa = ids.length >= faltan;
      const puntos = (completa ? 100 : 0) + enBandeja * 10 + ids.length;
      if (puntos > mejorPuntos) {
        mejorPuntos = puntos;
        mejor = ids.slice(0, completa ? faltan : Math.min(ids.length, 2));
      }
    }
    return mejor;
  }

  estrellas(): number {
    if (this.ayudasUsadas === 0) return 3;
    if (this.ayudasUsadas <= 2) return 2;
    return 1;
  }
}
