import { describe, expect, it } from 'vitest';
import { buscarCombinaciones, crearTablero, intentarMovimiento, mezclar, paramsBolitas, pasoCascada, pista } from '../src/core/bolitas';
import { mulberry32 } from '../src/core/rng';

describe('bolitas de colores', () => {
  it('el tablero inicial no trae combinaciones y siempre tiene un movimiento', () => {
    for (let s = 1; s <= 300; s++) {
      const t = crearTablero(7, 7, 5, mulberry32(s));
      expect(buscarCombinaciones(t).size).toBe(0);
      expect(pista(t)).not.toBeNull();
    }
  });

  it('un movimiento sin combinación se deshace', () => {
    const t = crearTablero(7, 7, 5, mulberry32(9));
    const antes = t.celdas.map((b) => b!.id);
    // Intercambiar dos bolitas no vecinas nunca es válido.
    expect(intentarMovimiento(t, 0, 10)).toBe(false);
    expect(t.celdas.map((b) => b!.id)).toEqual(antes);
  });

  it('la pista es un movimiento válido y la cascada termina con el tablero lleno', () => {
    const rng = mulberry32(42);
    const t = crearTablero(7, 7, 5, rng);
    for (let jugada = 0; jugada < 200; jugada++) {
      const [a, b] = pista(t) ?? (mezclar(t, rng), pista(t)!);
      expect(intentarMovimiento(t, a, b)).toBe(true);
      let pasos = 0;
      while (pasoCascada(t, rng)) expect(++pasos).toBeLessThan(100);
      expect(t.celdas.every((c) => c !== null)).toBe(true);
      expect(buscarCombinaciones(t).size).toBe(0);
    }
  });

  it('da movimientos de sobra respecto de los objetivos', () => {
    for (const d of ['muyFacil', 'facil', 'normal', 'desafio']) {
      const p = paramsBolitas(50, d, mulberry32(1));
      expect(p.objetivos).toHaveLength(2);
      expect(p.movimientos).toBeGreaterThanOrEqual(14);
    }
  });
});
