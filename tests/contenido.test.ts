import { describe, expect, it } from 'vitest';
import { VERSICULOS, versiculoDeNivel } from '../src/content/verses';
import { PREGUNTAS, preguntaNumero } from '../src/content/quiz';
import { FICHAS, FICHAS_POR_ID } from '../src/content/tiles';
import { LIBROS, ubicarNivel } from '../src/content/books';
import { exportarCodigo, guardadoNuevo, importarCodigo, limpiarNombre, normalizarGuardado } from '../src/storage';
import { comprarArticulo, comprarAyuda } from '../src/economy/wallet';
import { partirRef } from '../src/ui/biblia';

describe('versículos RVR1960', () => {
  it('tienen referencia válida, texto e ids únicos', () => {
    const ids = new Set<number>();
    for (const v of VERSICULOS) {
      expect(v.ref).toMatch(/^(\d )?[\p{L} ]+ \d+:\d+(-\d+)?$/u);
      expect(LIBROS).toContain(partirRef(v.ref).libro);
      expect(v.texto.length).toBeGreaterThan(10);
      for (const t of v.tags) expect(FICHAS_POR_ID.has(t)).toBe(true);
      expect(ids.has(v.id)).toBe(false);
      ids.add(v.id);
    }
  });

  it('no se repiten dentro de un ciclo del pool', () => {
    const vistos = new Set<number>();
    for (let n = 4; n < 4 + VERSICULOS.length; n++) vistos.add(versiculoDeNivel(n).id);
    expect(vistos.size).toBe(VERSICULOS.length);
  });
});

describe('preguntas', () => {
  it('tienen 3 opciones distintas y una sola correcta', () => {
    for (const p of PREGUNTAS) {
      expect(p.opciones).toHaveLength(3);
      expect(new Set(p.opciones).size).toBe(3);
      expect(p.correcta).toBeGreaterThanOrEqual(0);
      expect(p.correcta).toBeLessThan(3);
    }
  });

  it('no se repiten hasta agotar el banco', () => {
    const ids = new Set(Array.from({ length: PREGUNTAS.length }, (_, i) => preguntaNumero(i).id));
    expect(ids.size).toBe(PREGUNTAS.length);
  });
});

describe('fichas y recorrido', () => {
  it('hay 24 fichas en la primera vuelta y 30 en total', () => {
    expect(FICHAS.filter((f) => f.desdeVuelta === 1)).toHaveLength(24);
    expect(FICHAS).toHaveLength(30);
  });

  it('ubica los niveles en libros y vueltas sin fin', () => {
    expect(ubicarNivel(1).nombreLibro).toBe('Génesis');
    expect(ubicarNivel(21).nombreLibro).toBe('Éxodo');
    expect(ubicarNivel(1320).nombreLibro).toBe('Apocalipsis');
    expect(ubicarNivel(1321)).toMatchObject({ vuelta: 2, nombreLibro: 'Génesis' });
  });
});

describe('guardado y economía', () => {
  it('valida nombres', () => {
    expect(limpiarNombre('  Ana   María ')).toBe('Ana María');
    expect(limpiarNombre('Ñandú')).toBe('Ñandú');
    expect(limpiarNombre('<script>')).toBeNull();
    expect(limpiarNombre('')).toBeNull();
  });

  it('repara datos dañados y la voz viene desactivada', () => {
    const g = normalizarGuardado({ talentos: -5, nivelActual: 'x', config: { fps: 999 }, compras: ['falso'] });
    expect(g.talentos).toBe(0);
    expect(g.nivelActual).toBe(1);
    expect(g.config.fps).toBe(60);
    expect(g.config.vozActiva).toBe(false);
    expect(g.compras).not.toContain('falso');
  });

  it('exporta e importa el progreso', () => {
    const g = guardadoNuevo();
    g.nombre = 'José';
    g.nivelActual = 42;
    const copia = importarCodigo(exportarCodigo(g));
    expect(copia?.nombre).toBe('José');
    expect(copia?.nivelActual).toBe(42);
    expect(importarCodigo('basura')).toBeNull();
  });

  it('canjea solo con talentos suficientes', () => {
    const g = guardadoNuevo();
    g.talentos = 40;
    expect(comprarAyuda(g, 'lampara')).toBe('sinTalentos');
    expect(comprarAyuda(g, 'deshacer')).toBe('ok');
    expect(g.talentos).toBe(20);
    expect(comprarArticulo(g, 'galilea')).toBe('sinTalentos');
    expect(comprarArticulo(g, 'amanecer')).toBe('yaComprado');
  });
});

describe('tipos de juego', () => {
  it('cambian cada 3 niveles y se turnan todos', async () => {
    const { modalidadDe } = await import('../src/core/difficulty');
    expect([1, 2, 3].map((n) => modalidadDe(n))).toEqual(['clasico', 'clasico', 'clasico']);
    for (let bloque = 4; bloque < 400; bloque += 3) {
      const tipos = new Set([bloque, bloque + 1, bloque + 2].map((n) => modalidadDe(n)));
      expect(tipos.size).toBe(1);
      expect(modalidadDe(bloque + 3)).not.toBe(modalidadDe(bloque));
    }
    const todos = new Set(Array.from({ length: 60 }, (_, i) => modalidadDe(i + 4)));
    expect([...todos].sort()).toEqual(['animalitos', 'bolitas', 'burbujas', 'clasico', 'dorado', 'sorpresa', 'torre']);
    expect(Array.from({ length: 200 }, (_, i) => modalidadDe(i + 1, 'muyFacil'))).not.toContain('sorpresa');
  });
});
