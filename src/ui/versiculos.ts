import { app, type Pantalla } from '../app';
import { CREDITO_RVR1960, VERSICULOS_POR_ID } from '../content/verses';
import { boton, h } from './dom';
import { tarjetaVersiculo } from './componentes';

function fechaLegible(clave: string): string {
  const [y, m, d] = clave.split('-').map(Number);
  if (!y) return '';
  return new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Los versículos recibidos al completar niveles, con favoritos. */
export function pantallaVersiculos(params: Record<string, unknown>): Pantalla {
  const soloFavoritos = params.filtro === 'favoritos';
  const g = app.g;
  const recibidos = g.versiculos.filter((r) => VERSICULOS_POR_ID.has(r.id));
  const mostrados = soloFavoritos ? recibidos.filter((r) => g.favoritos.includes(r.id)) : recibidos;
  const vistos = new Set<number>();

  const filtros = h('div', { class: 'pestanas', role: 'group', 'aria-label': 'Filtro' });
  const todos = boton(`Todos (${recibidos.length})`, () => app.ir('versiculos'), { variante: 'secundario' });
  todos.setAttribute('aria-pressed', String(!soloFavoritos));
  const favs = boton(`Favoritos (${recibidos.filter((r) => g.favoritos.includes(r.id)).length})`, () => app.ir('versiculos', { filtro: 'favoritos' }), {
    variante: 'secundario',
  });
  favs.setAttribute('aria-pressed', String(soloFavoritos));
  filtros.append(todos, favs);

  const lista = h('div', { class: 'lista-versiculos' });
  for (const r of mostrados) {
    if (vistos.has(r.id)) continue;
    vistos.add(r.id);
    const v = VERSICULOS_POR_ID.get(r.id)!;
    lista.append(tarjetaVersiculo(v, { favorito: true, detalle: `Nivel ${r.nivel}${r.fecha ? ` · ${fechaLegible(r.fecha)}` : ''}`, credito: false }));
  }
  if (!lista.childElementCount) {
    lista.append(
      h(
        'div',
        { class: 'tarjeta pila centrado' },
        h('p', { class: 'texto-grande', text: soloFavoritos ? 'Todavía no marcaste favoritos. Toca «☆ Favorito» en un versículo.' : 'Aquí aparecerán los versículos que recibas al completar niveles.' }),
        boton('Jugar', () => app.ir('juego', { nivel: g.nivelActual }), { icono: '▶', variante: 'primario' }),
      ),
    );
  }

  const el = h(
    'main',
    { class: 'pantalla pila' },
    h('header', { class: 'cabecera' }, boton('Volver', () => app.ir('inicio'), { icono: '←' }), h('h1', { text: '📖 Mis versículos' })),
    filtros,
    lista,
    h('p', { class: 'credito', text: CREDITO_RVR1960 }),
  );
  return { el };
}
