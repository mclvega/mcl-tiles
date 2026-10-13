import { describe, expect, it } from 'vitest';
import {
  COLUMNAS,
  FILAS,
  centro,
  colgantes,
  colocar,
  colorParaLanzar,
  columnasDeFila,
  crearTablero,
  grupoMismoColor,
  paramsBurbujas,
  trayectoria,
  vacio,
  vecinos,
  type TableroBurbujas,
} from '../src/core/burbujas';
import { mulberry32 } from '../src/core/rng';

const vacioTablero = (): TableroBurbujas => ({
  filas: Array.from({ length: FILAS }, (_, f) => Array<number | null>(columnasDeFila(f)).fill(null)),
  colores: 4,
});

describe('disparador de burbujas', () => {
  it('los vecinos son simétricos y dentro del tablero', () => {
    for (let f = 0; f < FILAS; f++) {
      for (let c = 0; c < columnasDeFila(f); c++) {
        for (const v of vecinos(f, c)) {
          expect(vecinos(v.f, v.c)).toContainEqual({ f, c });
          const a = centro(f, c);
          const b = centro(v.f, v.c);
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(2, 5);
        }
      }
    }
  });

  it('tres del mismo color explotan y las colgantes caen', () => {
    const t = vacioTablero();
    t.filas[0][0] = 1;
    t.filas[0][1] = 1;
    t.filas[1][0] = 2; // cuelga de (0,0) y (0,1)
    t.filas[2][0] = 3; // cuelga de (1,0)
    const r = colocar(t, { f: 0, c: 2 }, 1);
    expect(r.reventadas).toHaveLength(3);
    expect(r.caidas).toHaveLength(2);
    expect(vacio(t)).toBe(true);
  });

  it('dos del mismo color no explotan', () => {
    const t = vacioTablero();
    t.filas[0][0] = 1;
    const r = colocar(t, { f: 0, c: 1 }, 1);
    expect(r.reventadas).toHaveLength(0);
    expect(grupoMismoColor(t, { f: 0, c: 0 })).toHaveLength(2);
    expect(colgantes(t)).toHaveLength(0);
  });

  it('un disparo recto hacia arriba se pega al techo en la columna del medio', () => {
    const t = vacioTablero();
    const tr = trayectoria(t, COLUMNAS, 30, -Math.PI / 2);
    expect(tr.celda).toEqual({ f: 0, c: Math.floor(COLUMNAS / 2) });
  });

  it('un disparo inclinado rebota en la pared', () => {
    const t = vacioTablero();
    const tr = trayectoria(t, COLUMNAS, 30, -Math.PI / 2 - 1.1);
    expect(tr.puntos.length).toBeGreaterThan(2);
    expect(tr.celda).not.toBeNull();
  });

  it('jugando con sentido siempre se puede vaciar el tablero', () => {
    for (let s = 1; s <= 30; s++) {
      const rng = mulberry32(s);
      const p = paramsBurbujas(50, 'normal', false);
      const t = crearTablero(p.filas, p.colores, rng);
      let disparos = 0;
      while (!vacio(t) && disparos < 400) {
        const color = colorParaLanzar(t, rng);
        // Busca el ángulo que deja la burbuja junto a otra del mismo color.
        let elegido = null;
        for (let a = -Math.PI + 0.12; a < -0.12; a += 0.02) {
          const tr = trayectoria(t, COLUMNAS, 1 + FILAS * Math.sqrt(3) + 2, a);
          if (!tr.celda) continue;
          if (vecinos(tr.celda.f, tr.celda.c).some((v) => t.filas[v.f][v.c] === color)) {
            elegido = tr.celda;
            break;
          }
          elegido ??= tr.celda;
        }
        expect(elegido).not.toBeNull();
        colocar(t, elegido!, color);
        disparos++;
      }
      expect(vacio(t)).toBe(true);
    }
  });
});
