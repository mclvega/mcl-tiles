import { describe, expect, it } from 'vitest';
import { MODOS, paramsNivel, type Dificultad } from '../src/core/difficulty';
import { generarTablero } from '../src/core/generator';
import { Partida } from '../src/core/game';
import { poolDeVuelta } from '../src/content/tiles';
import { protagonistaDe, versiculoDeNivel } from '../src/content/verses';
import { ubicarNivel } from '../src/content/books';

function generar(n: number, dificultad: Dificultad, masFacil = false) {
  const p = paramsNivel(n, dificultad, masFacil);
  const pool = poolDeVuelta(ubicarNivel(n).vuelta);
  const protagonista = protagonistaDe(versiculoDeNivel(n), pool);
  return { p, tablero: generarTablero(p, { pool, protagonista }) };
}

/** Juega la solución incluida y comprueba que gana sin llenar la bandeja. */
function jugarSolucion(n: number, dificultad: Dificultad, masFacil = false) {
  const { p, tablero } = generar(n, dificultad, masFacil);
  const partida = new Partida(tablero, p.bandeja);
  for (const id of tablero.solucion) {
    const r = partida.elegir(id);
    if (!r) throw new Error(`Nivel ${n} (${dificultad}): la ficha ${id} no estaba libre`);
    if (r.estado === 'perdido') throw new Error(`Nivel ${n} (${dificultad}): la bandeja se llenó`);
  }
  expect(partida.estado).toBe('ganado');
  return { p, tablero };
}

describe('generador de niveles', { timeout: 120_000 }, () => {
  it('es determinista: el mismo nivel produce el mismo tablero', () => {
    for (const n of [1, 7, 55, 321, 4000]) {
      const a = generar(n, 'normal').tablero;
      const b = generar(n, 'normal').tablero;
      expect(a.fichas).toEqual(b.fichas);
    }
  });

  it('los niveles 1 a 10 000 en modo Normal siempre tienen solución', () => {
    for (let n = 1; n <= 10_000; n++) jugarSolucion(n, 'normal');
  });

  it('los niveles 1 a 2 000 tienen solución en los otros modos y en "más fácil"', () => {
    for (const d of Object.keys(MODOS) as Dificultad[]) {
      for (let n = 1; n <= 2_000; n++) jugarSolucion(n, d);
    }
    for (let n = 1; n <= 500; n++) jugarSolucion(n, 'normal', true);
  });

  it('cada tipo aparece en múltiplos de 3 y respeta la cantidad pedida', () => {
    for (let n = 1; n <= 600; n++) {
      const { p, tablero } = generar(n, 'normal');
      expect(tablero.fichas.length).toBe(p.fichas);
      const cuenta = new Map<string, number>();
      for (const f of tablero.fichas) cuenta.set(f.tipo, (cuenta.get(f.tipo) ?? 0) + 1);
      for (const c of cuenta.values()) expect(c % 3).toBe(0);
      expect(tablero.capas).toBeLessThanOrEqual(MODOS.normal.capasMax);
    }
  });

  it('la ficha protagonista (la del versículo) es la que más aparece', () => {
    for (let n = 4; n <= 400; n++) {
      const { tablero } = generar(n, 'normal');
      if (!tablero.protagonista) continue;
      const cuenta = new Map<string, number>();
      for (const f of tablero.fichas) cuenta.set(f.tipo, (cuenta.get(f.tipo) ?? 0) + 1);
      const maximo = Math.max(...cuenta.values());
      expect(cuenta.get(tablero.protagonista)).toBe(maximo);
    }
  });

  it('el tutorial empieza muy simple', () => {
    expect(generar(1, 'normal').tablero.fichas.length).toBe(9);
    expect(generar(2, 'normal').tablero.fichas.length).toBe(12);
    expect(generar(3, 'normal').tablero.fichas.length).toBe(18);
    expect(generar(1, 'normal').tablero.capas).toBe(1);
  });

  it('genera cada nivel en menos de 50 ms', () => {
    const inicio = performance.now();
    const total = 300;
    for (let n = 5000; n < 5000 + total; n++) generar(n, 'desafio');
    expect((performance.now() - inicio) / total).toBeLessThan(50);
  });
});
