import { app, type Pantalla } from '../app';
import { LIBROS } from '../content/books';
import { CREDITO_RVR1960, VERSICULOS, textoVisible, type Versiculo } from '../content/verses';
import { voz } from '../speech';
import { abrirModal, boton, h } from './dom';

/** "1 Juan 4:8" → { libro: '1 Juan', capitulo: 4, versiculo: 8 }. */
export function partirRef(ref: string): { libro: string; capitulo: number; versiculo: number } {
  const m = /^(.+?)\s(\d+):(\d+)/.exec(ref);
  return m ? { libro: m[1], capitulo: Number(m[2]), versiculo: Number(m[3]) } : { libro: ref, capitulo: 0, versiculo: 0 };
}

/** Versículos incluidos en el juego para un libro, en orden bíblico. */
export function versiculosDeLibro(libro: string): Versiculo[] {
  return VERSICULOS.filter((v) => partirRef(v.ref).libro === libro).sort((a, b) => {
    const pa = partirRef(a.ref);
    const pb = partirRef(b.ref);
    return pa.capitulo - pb.capitulo || pa.versiculo - pb.versiculo;
  });
}

export const LIBROS_CON_VERSICULOS = LIBROS.filter((l) => versiculosDeLibro(l).length > 0);

function listaVersiculos(libro: string, destacado?: number): HTMLElement {
  const lista = h('div', { class: 'lista-versiculos' });
  for (const v of versiculosDeLibro(libro)) {
    const fila = h(
      'article',
      { class: `tarjeta versiculo${v.id === destacado ? ' destacado' : ''}` },
      h('cite', { text: v.ref }),
      h('p', { class: 'texto-grande', text: textoVisible(v) }),
    );
    if (app.vozActiva()) fila.append(boton('Escuchar', () => voz.hablar(`${textoVisible(v)}. ${v.ref}.`), { icono: '🔊', variante: 'suave' }));
    lista.append(fila);
  }
  return lista;
}

/** Abre, sin salir del juego, los versículos del mismo libro guardados en el juego. */
export function abrirLectura(v: Versiculo): void {
  const { libro } = partirRef(v.ref);
  const modal = abrirModal({
    titulo: `📖 ${libro}`,
    contenido: h(
      'div',
      { class: 'pila' },
      h('p', { class: 'texto-suave', text: 'Versículos de este libro incluidos en el juego (Reina-Valera 1960).' }),
      listaVersiculos(libro, v.id),
      h('p', { class: 'credito', text: CREDITO_RVR1960 }),
    ),
  });
  requestAnimationFrame(() => modal.caja.querySelector('.destacado')?.scrollIntoView({ block: 'center' }));
}

/** Pantalla "Biblia": todos los versículos incluidos, por libro. Funciona sin conexión. */
export function pantallaBiblia(params: Record<string, unknown>): Pantalla {
  const libro = typeof params.libro === 'string' && LIBROS_CON_VERSICULOS.includes(params.libro as never) ? params.libro : null;
  const contenido = libro
    ? h('div', { class: 'pila' }, boton('Todos los libros', () => app.ir('biblia'), { icono: '📚' }), h('h2', { text: libro }), listaVersiculos(libro))
    : h(
        'div',
        { class: 'niveles' },
        ...LIBROS_CON_VERSICULOS.map((l) =>
          boton(`${l} (${versiculosDeLibro(l).length})`, () => app.ir('biblia', { libro: l }), { clase: 'nivel-btn' }),
        ),
      );
  const el = h(
    'main',
    { class: 'pantalla pila' },
    h('header', { class: 'cabecera' }, boton('Volver', () => app.ir('inicio'), { icono: '←' }), h('h1', { text: '📖 Biblia' })),
    h('p', { class: 'texto-suave', text: `${VERSICULOS.length} versículos de la Reina-Valera 1960 guardados en el juego. No necesitas internet para leerlos.` }),
    contenido,
    h('p', { class: 'credito', text: CREDITO_RVR1960 }),
  );
  return { el };
}
