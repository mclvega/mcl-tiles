import { app, type Pantalla } from '../app';
import { LIBROS, NIVELES_POR_LIBRO, NIVELES_POR_VUELTA, ubicarNivel } from '../content/books';
import { boton, h } from './dom';

/** Mapa del recorrido infinito: vuelta → libro → 20 niveles. */
export function pantallaRecorrido(params: Record<string, unknown>): Pantalla {
  const g = app.g;
  const actual = ubicarNivel(g.nivelActual);
  const primerNivel = typeof params.primerNivel === 'number' ? params.primerNivel : actual.primerNivel;
  const ub = ubicarNivel(primerNivel);

  const niveles = h('div', { class: 'niveles' });
  for (let i = 0; i < NIVELES_POR_LIBRO; i++) {
    const n = ub.primerNivel + i;
    const estrellas = g.estrellas[n] ?? 0;
    const bloqueado = n > g.nivelActual;
    const esActual = n === g.nivelActual;
    const b = h(
      'button',
      {
        type: 'button',
        class: `btn ${esActual ? 'btn-primario actual' : 'btn-secundario'} nivel-btn`,
        disabled: bloqueado,
        'aria-label': bloqueado ? `Nivel ${n}, bloqueado` : esActual ? `Nivel ${n}, siguiente nivel` : `Nivel ${n}, ${estrellas} estrellas`,
        onclick: () => app.ir('juego', { nivel: n }),
      },
      h('span', { class: 'num', text: bloqueado ? '🔒' : String(n) }),
      h('span', { class: 'est', 'aria-hidden': 'true', text: bloqueado ? '' : esActual ? '▶ Jugar' : '⭐'.repeat(estrellas) || '✔' }),
    );
    niveles.append(b);
  }

  const libroAnterior = primerNivel - NIVELES_POR_LIBRO;
  const libroSiguiente = primerNivel + NIVELES_POR_LIBRO;
  const completadosVuelta = Math.min(NIVELES_POR_VUELTA, Math.max(0, g.nivelActual - 1 - (ub.vuelta - 1) * NIVELES_POR_VUELTA));
  const porcentaje = Math.round((completadosVuelta / NIVELES_POR_VUELTA) * 100);

  const el = h(
    'main',
    { class: 'pantalla pila' },
    h('header', { class: 'cabecera' }, boton('Volver', () => app.ir('inicio'), { icono: '←' }), h('h1', { text: '🗺️ Recorrido' })),
    h(
      'section',
      { class: 'tarjeta pila' },
      h('h2', { text: app.biblico() ? ub.nombreLibro : `Etapa ${ub.libro + 1}` }),
      h('p', { class: 'texto-suave', text: `Vuelta ${ub.vuelta} · ${app.biblico() ? 'Libro' : 'Etapa'} ${ub.libro + 1} de ${LIBROS.length} · Niveles ${ub.primerNivel} a ${ub.primerNivel + NIVELES_POR_LIBRO - 1}` }),
      h('p', { text: `Avance de la vuelta ${ub.vuelta}: ${porcentaje} %` }),
      h('div', { class: 'progreso', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(porcentaje) }, h('div', { style: { width: `${porcentaje}%` } })),
      h(
        'div',
        { class: 'fila-botones' },
        boton(app.biblico() ? 'Libro anterior' : 'Etapa anterior', () => app.ir('recorrido', { primerNivel: libroAnterior }), { icono: '◀', deshabilitado: libroAnterior < 1 }),
        boton(app.biblico() ? 'Libro siguiente' : 'Etapa siguiente', () => app.ir('recorrido', { primerNivel: libroSiguiente }), { icono: '▶', deshabilitado: libroSiguiente > g.nivelActual }),
      ),
    ),
    niveles,
    h('p', { class: 'texto-suave centrado', text: app.biblico() ? 'El recorrido no termina: después de Apocalipsis empieza una nueva vuelta con fichas nuevas.' : 'El recorrido no termina: siempre hay más niveles.' }),
  );
  return { el };
}
