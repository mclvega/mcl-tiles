import { app, type Pantalla } from '../app';
import { audio } from '../audio';
import { MODALIDADES, modalidadDe, type ParamsNivel } from '../core/difficulty';
import {
  crearTablero,
  intentarMovimiento,
  mezclar,
  paramsBolitas,
  pasoCascada,
  pista,
  sonVecinas,
  type Bola,
} from '../core/bolitas';
import { rngFrom } from '../core/rng';
import { efectos } from '../fx/loop';
import { chipTalentos, mostrarAnimo } from './componentes';
import { abrirModal, avisar, boton, confirmar, esperar, h, hayModalAbierto, type Modal } from './dom';
import { celebrarNivel } from './finNivel';
import { abrirPregunta } from './pregunta';

/** Colores de las bolitas. Cada una lleva además un símbolo, para quien distingue mal los colores. */
export const COLORES = [
  { nombre: 'roja', fondo: '#e53935', oscuro: '#a31515', simbolo: '♥', tinta: '#ffffff' },
  { nombre: 'azul', fondo: '#1e88e5', oscuro: '#0d4f99', simbolo: '◆', tinta: '#ffffff' },
  { nombre: 'verde', fondo: '#43a047', oscuro: '#1f6b24', simbolo: '♣', tinta: '#ffffff' },
  { nombre: 'amarilla', fondo: '#fdd835', oscuro: '#c79a00', simbolo: '★', tinta: '#6b4a00' },
  { nombre: 'morada', fondo: '#8e24aa', oscuro: '#5a1270', simbolo: '●', tinta: '#ffffff' },
];

const ANCHO = 7;
const ALTO = 7;
const MOVIMIENTOS_EXTRA = 5;
const ESPERA_PISTA_MS = 10000;

/** Nivel de «Bolitas de colores»: combinar 3 tocando dos bolitas vecinas. */
export function pantallaBolitas(n: number, p: ParamsNivel): Pantalla {
  const rng = rngFrom(`bolitas:${n}:${p.dificultad}`);
  const config = paramsBolitas(n, p.dificultad, rng, p.tipoNivel === 'reto');
  const tablero = crearTablero(ANCHO, ALTO, config.colores, rng);
  const objetivos = config.objetivos.map((o) => ({ ...o, juntadas: 0 }));
  const movimientosTotales = config.movimientos;
  let movimientos = movimientosTotales;
  let extraUsado = false;
  let seleccion: number | null = null;
  let ocupado = false;
  let terminado = false;
  let temporizadorPista: number | undefined;
  const reducidas = () => app.g.config.animacionesReducidas;

  const talentos = chipTalentos();
  const zona = h('div', { class: 'zona-bolitas' });
  const tableroEl = h('div', { class: 'tablero-bolitas', role: 'grid', 'aria-label': 'Tablero de bolitas' });
  zona.append(tableroEl);
  const objetivosEl = h('div', { class: 'objetivos-bolitas', 'aria-live': 'polite' });
  const subtitulo = [p.tipoNivel === 'reto' ? '⭐ Nivel reto · premio doble' : '', `${MODALIDADES.bolitas.icono} ${MODALIDADES.bolitas.nombre}`]
    .filter(Boolean)
    .join(' · ');

  const el = h(
    'main',
    { class: 'juego juego-bolitas' },
    h(
      'header',
      { class: 'barra-juego' },
      boton('Pausa', () => abrirPausa(), { icono: '⏸', variante: 'secundario', etiqueta: 'Pausa' }),
      h('div', { class: 'titulo-nivel' }, h('h1', { text: `Nivel ${n}` }), h('span', { text: subtitulo })),
      talentos.el,
    ),
    objetivosEl,
    zona,
  );

  /* ---------- Dibujo ---------- */

  const elementos = new Map<number, HTMLButtonElement>();
  let tamCelda = 48;

  function crearBola(b: Bola): HTMLButtonElement {
    const c = COLORES[b.color];
    const e = h('button', {
      type: 'button',
      class: 'bolita',
      'aria-label': `Bolita ${c.nombre}`,
      style: {
        '--color': c.fondo,
        '--oscuro': c.oscuro,
        color: c.tinta,
      } as unknown as Partial<CSSStyleDeclaration>,
      text: c.simbolo,
      onclick: () => {
        if (performance.now() - ultimoGesto > 500) void tocar(b.id);
      },
    });
    e.style.setProperty('--color', c.fondo);
    e.style.setProperty('--oscuro', c.oscuro);
    elementos.set(b.id, e);
    tableroEl.append(e);
    return e;
  }

  function posicion(e: HTMLElement, i: number): void {
    e.style.left = `${(i % ANCHO) * tamCelda}px`;
    e.style.top = `${Math.floor(i / ANCHO) * tamCelda}px`;
  }

  function dibujar(nuevas: Bola[] = []): void {
    const nuevasIds = new Set(nuevas.map((b) => b.id));
    tablero.celdas.forEach((b, i) => {
      if (!b) return;
      let e = elementos.get(b.id);
      if (!e) {
        e = crearBola(b);
        e.style.width = e.style.height = `${tamCelda}px`;
        if (nuevasIds.has(b.id) && !reducidas()) {
          // Las nuevas caen desde arriba del tablero.
          e.style.transition = 'none';
          e.style.left = `${(i % ANCHO) * tamCelda}px`;
          e.style.top = `${-tamCelda * (1 + Math.floor(i / ANCHO))}px`;
          void e.offsetWidth;
          e.style.transition = '';
        }
      }
      e.dataset.indice = String(i);
      e.classList.toggle('elegida', seleccion === i);
      posicion(e, i);
    });
  }

  function distribuir(): void {
    const r = zona.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    tamCelda = Math.floor(Math.min(92, (r.width - 8) / ANCHO, (r.height - 8) / ALTO));
    tableroEl.style.width = `${tamCelda * ANCHO}px`;
    tableroEl.style.height = `${tamCelda * ALTO}px`;
    tableroEl.style.setProperty('--celda', `${tamCelda}px`);
    for (const e of elementos.values()) e.style.width = e.style.height = `${tamCelda}px`;
    dibujar();
  }

  function pintarObjetivos(): void {
    objetivosEl.replaceChildren(
      ...objetivos.map((o) => {
        const c = COLORES[o.color];
        const hecho = o.juntadas >= o.cantidad;
        const mini = h('span', { class: 'bolita mini', 'aria-hidden': 'true', text: c.simbolo, style: { color: c.tinta } });
        mini.style.setProperty('--color', c.fondo);
        mini.style.setProperty('--oscuro', c.oscuro);
        return h(
          'div',
          { class: `objetivo${hecho ? ' hecho' : ''}`, 'aria-label': `Bolitas ${c.nombre}s: ${Math.min(o.juntadas, o.cantidad)} de ${o.cantidad}` },
          mini,
          h('span', { text: hecho ? '✔' : `${Math.min(o.juntadas, o.cantidad)}/${o.cantidad}` }),
        );
      }),
      h('div', { class: `movimientos${movimientos <= 3 ? ' pocos' : ''}`, 'aria-label': `Quedan ${movimientos} movimientos` }, h('span', { 'aria-hidden': 'true', text: '👆' }), h('strong', { text: String(movimientos) }), h('span', { class: 'mov-texto', text: ' movimientos' })),
    );
  }

  /* ---------- Pista ---------- */

  function quitarPista(): void {
    tableroEl.querySelectorAll('.pista').forEach((e) => e.classList.remove('pista'));
  }
  function reiniciarPista(): void {
    window.clearTimeout(temporizadorPista);
    quitarPista();
    if (!app.g.config.ayudaAutomatica || terminado) return;
    temporizadorPista = window.setTimeout(() => {
      const par = pista(tablero);
      if (!par || ocupado || terminado) return;
      for (const i of par) elementos.get(tablero.celdas[i]!.id)?.classList.add('pista');
    }, ESPERA_PISTA_MS);
  }

  /* ---------- Jugadas ---------- */

  function indiceDe(id: number): number {
    return tablero.celdas.findIndex((b) => b?.id === id);
  }

  async function tocar(id: number): Promise<void> {
    if (ocupado || terminado) return;
    const i = indiceDe(id);
    if (i < 0) return;
    reiniciarPista();
    if (seleccion === null || seleccion === i) {
      seleccion = seleccion === i ? null : i;
      audio.efecto('boton');
      dibujar();
      return;
    }
    if (!sonVecinas(tablero, seleccion, i)) {
      seleccion = i;
      audio.efecto('boton');
      dibujar();
      return;
    }
    const a = seleccion;
    seleccion = null;
    ocupado = true;
    try {
      await mover(a, i);
    } finally {
      ocupado = false;
    }
  }

  async function mover(a: number, b: number): Promise<void> {
    if (!intentarMovimiento(tablero, a, b)) {
      // No forma línea: se intercambian y vuelven.
      audio.efecto('bloqueada');
      const ea = elementos.get(tablero.celdas[a]!.id)!;
      const eb = elementos.get(tablero.celdas[b]!.id)!;
      posicion(ea, b);
      posicion(eb, a);
      if (!reducidas()) await esperar(200);
      dibujar();
      ea.classList.add('tiembla');
      eb.classList.add('tiembla');
      setTimeout(() => {
        ea.classList.remove('tiembla');
        eb.classList.remove('tiembla');
      }, 400);
      return;
    }
    movimientos--;
    audio.efecto('toc');
    dibujar();
    if (!reducidas()) await esperar(220);
    let cadena = 0;
    for (;;) {
      const paso = pasoCascada(tablero, rng);
      if (!paso) break;
      cadena++;
      for (const bola of paso.eliminadas) {
        const e = elementos.get(bola.id);
        if (e) {
          const r = e.getBoundingClientRect();
          efectos.destellos(r.left + r.width / 2, r.top + r.height / 2, COLORES[bola.color].fondo);
          e.classList.add('explota');
        }
        const obj = objetivos.find((o) => o.color === bola.color);
        if (obj) obj.juntadas++;
      }
      audio.efecto('trio');
      pintarObjetivos();
      if (!reducidas()) await esperar(260);
      for (const bola of paso.eliminadas) {
        elementos.get(bola.id)?.remove();
        elementos.delete(bola.id);
      }
      dibujar(paso.nuevas);
      if (!reducidas()) await esperar(300);
    }
    if (cadena >= 2) mostrarAnimo(cadena >= 3 ? '¡Cascada increíble!' : '¡Doble combinación!');
    pintarObjetivos();

    if (objetivos.every((o) => o.juntadas >= o.cantidad)) {
      await ganar();
      return;
    }
    if (movimientos <= 0) {
      perder();
      return;
    }
    if (!pista(tablero)) {
      mostrarAnimo('🔀 Mezclando bolitas');
      mezclar(tablero, rng);
      for (const e of elementos.values()) e.remove();
      elementos.clear();
      dibujar(tablero.celdas.filter((x): x is Bola => !!x));
    }
    reiniciarPista();
  }

  /* ---------- Fin ---------- */

  async function ganar(): Promise<void> {
    terminado = true;
    window.clearTimeout(temporizadorPista);
    const proporcion = movimientos / movimientosTotales;
    const estrellas = extraUsado ? 1 : proporcion >= 0.35 ? 3 : proporcion >= 0.15 ? 2 : 1;
    await celebrarNivel({ n, estrellas, p, alGuardar: () => talentos.refrescar() });
  }

  function perder(): void {
    window.clearTimeout(temporizadorPista);
    app.g.fallos[n] = (app.g.fallos[n] ?? 0) + 1;
    app.guardar();
    audio.efecto('aviso');
    const acciones = h('div', { class: 'pila' });
    if (!extraUsado) {
      const b = boton(`Responder una pregunta: +${MOVIMIENTOS_EXTRA} movimientos`, async () => {
        modal.cerrar();
        const acerto = await abrirPregunta({
          titulo: '❓ Movimientos extra',
          premio: `Responde y recibe ${MOVIMIENTOS_EXTRA} movimientos más.`,
          resultado: (ok) => (ok ? `+${MOVIMIENTOS_EXTRA} movimientos. ¡Adelante!` : `Igual te damos ${MOVIMIENTOS_EXTRA - 2} movimientos. ¡Adelante!`),
          autoCerrarMs: 3000,
        });
        extraUsado = true;
        movimientos += acerto ? MOVIMIENTOS_EXTRA : MOVIMIENTOS_EXTRA - 2;
        pintarObjetivos();
        reiniciarPista();
      }, { icono: '❓', variante: 'primario', clase: 'btn-ancho' });
      b.dataset.focoInicial = '';
      acciones.append(b);
    }
    acciones.append(
      boton('Intentar de nuevo', () => {
        modal.cerrar();
        app.ir('juego', { nivel: n });
      }, { icono: '🔄', clase: 'btn-ancho' }),
      boton('Volver al inicio', () => {
        modal.cerrar();
        app.ir('inicio');
      }, { icono: '🏠', variante: 'suave', clase: 'btn-ancho' }),
    );
    const modal: Modal = abrirModal({
      titulo: `¡Casi lo logras, ${app.nombre()}!`,
      cerrable: false,
      contenido: h('div', { class: 'pila' }, h('p', { class: 'texto-grande', text: 'Se terminaron los movimientos.' }), acciones),
    });
  }

  function abrirPausa(): void {
    if (terminado || hayModalAbierto()) return;
    window.clearTimeout(temporizadorPista);
    const continuar = boton('Continuar', () => modal.cerrar(), { icono: '▶', variante: 'primario', clase: 'btn-ancho' });
    continuar.dataset.focoInicial = '';
    const modal = abrirModal({
      titulo: '⏸ Pausa',
      contenido: h(
        'div',
        { class: 'pila' },
        h('p', { class: 'texto-suave', text: 'Desliza una bolita hacia su vecina para cambiarlas de lugar (o tócalas una y otra). Junta 3 o más del mismo color en línea.' }),
        continuar,
        boton('Reiniciar el nivel', async () => {
          modal.cerrar();
          if (await confirmar('Reiniciar el nivel', '¿Quieres empezar este nivel de nuevo?', 'Sí, reiniciar')) app.ir('juego', { nivel: n });
        }, { icono: '🔄', clase: 'btn-ancho' }),
        boton('Ir al inicio', () => {
          modal.cerrar();
          app.ir('inicio');
        }, { icono: '🏠', variante: 'suave', clase: 'btn-ancho' }),
      ),
      alCerrar: () => reiniciarPista(),
    });
  }

  const alTeclear = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && !hayModalAbierto()) abrirPausa();
  };
  document.addEventListener('keydown', alTeclear);

  /* ---------- Deslizar ---------- */

  // Se pone el dedo (o el mouse) en una bolita y se desliza hacia la vecina.
  let ultimoGesto = 0;
  let gesto: { id: number; x: number; y: number; usado: boolean } | null = null;
  tableroEl.addEventListener('pointerdown', (ev) => {
    const bola = (ev.target as HTMLElement).closest<HTMLElement>('.bolita');
    if (!bola || ocupado || terminado) return;
    const id = [...elementos.entries()].find(([, e]) => e === bola)?.[0];
    if (id === undefined) return;
    gesto = { id, x: ev.clientX, y: ev.clientY, usado: false };
    ultimoGesto = performance.now();
    tableroEl.setPointerCapture?.(ev.pointerId);
  });
  tableroEl.addEventListener('pointermove', (ev) => {
    if (!gesto || gesto.usado) return;
    const dx = ev.clientX - gesto.x;
    const dy = ev.clientY - gesto.y;
    const umbral = Math.max(18, tamCelda * 0.3);
    if (Math.hypot(dx, dy) < umbral) return;
    gesto.usado = true;
    ultimoGesto = performance.now();
    const desde = indiceDe(gesto.id);
    if (desde < 0) return;
    const x = desde % ANCHO;
    const y = Math.floor(desde / ANCHO);
    const [nx, ny] = Math.abs(dx) > Math.abs(dy) ? [x + Math.sign(dx), y] : [x, y + Math.sign(dy)];
    if (nx < 0 || ny < 0 || nx >= ANCHO || ny >= ALTO) return;
    void deslizar(desde, ny * ANCHO + nx);
  });
  const terminarGesto = () => {
    if (gesto && !gesto.usado) {
      // Sin deslizar: funciona como un toque (elegir y luego tocar la vecina).
      ultimoGesto = performance.now();
      void tocar(gesto.id);
    }
    gesto = null;
  };
  tableroEl.addEventListener('pointerup', terminarGesto);
  tableroEl.addEventListener('pointercancel', () => (gesto = null));

  async function deslizar(a: number, b: number): Promise<void> {
    if (ocupado || terminado) return;
    reiniciarPista();
    seleccion = null;
    ocupado = true;
    try {
      await mover(a, b);
    } finally {
      ocupado = false;
    }
  }

  const observador = new ResizeObserver(() => distribuir());
  observador.observe(zona);
  pintarObjetivos();
  requestAnimationFrame(() => {
    distribuir();
    setTimeout(() => mostrarAnimo(`${MODALIDADES.bolitas.icono} ${MODALIDADES.bolitas.nombre}`), 250);
    // Explicación breve solo la primera vez que se juega un nivel de bolitas.
    const yaJugo = Object.keys(app.g.estrellas).some((k) => Number(k) !== n && modalidadDe(Number(k), p.dificultad) === 'bolitas');
    if (!yaJugo && !app.g.estrellas[n]) {
      avisar('Desliza una bolita hacia su vecina para cambiarlas. ¡Junta 3 iguales!', 5000);
    }
    reiniciarPista();
  });

  return {
    el,
    limpiar: () => {
      observador.disconnect();
      window.clearTimeout(temporizadorPista);
      document.removeEventListener('keydown', alTeclear);
      efectos.limpiar();
    },
  };
}
