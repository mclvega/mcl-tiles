import { app, type Pantalla } from '../app';
import { audio } from '../audio';
import {
  COLUMNAS,
  FILAS,
  anchoTablero,
  centro,
  colocar,
  colorParaLanzar,
  columnasDeFila,
  crearTablero,
  paramsBurbujas,
  trayectoria,
  vacio,
  vecinos,
  type Celda,
} from '../core/burbujas';
import { MODALIDADES, type ParamsNivel } from '../core/difficulty';
import { rngFrom } from '../core/rng';
import { efectos } from '../fx/loop';
import { COLORES } from './bolitas';
import { chipTalentos, mostrarAnimo } from './componentes';
import { abrirModal, avisar, boton, confirmar, h, hayModalAbierto, type Modal } from './dom';
import { celebrarNivel } from './finNivel';
import { abrirPregunta } from './pregunta';

const ALTO_FILA = Math.sqrt(3);
const FONDO_TABLERO = 1 + (FILAS - 1) * ALTO_FILA + 1;
const Y_LANZADOR = FONDO_TABLERO + 2.6;
const ALTO_TOTAL = Y_LANZADOR + 2.2;
const ANGULO_MIN = -Math.PI + 0.13;
const ANGULO_MAX = -0.13;
const DISPAROS_EXTRA = 5;
const ESPERA_PISTA_MS = 10000;

interface Animada {
  x: number;
  y: number;
  color: number;
  t: number;
  vy: number;
  tipo: 'revienta' | 'cae';
}

/** Nivel «Disparador de burbujas»: apuntar, disparar y juntar 3 del mismo color. */
export function pantallaBurbujas(n: number, p: ParamsNivel): Pantalla {
  const rng = rngFrom(`burbujas:${n}:${p.dificultad}`);
  const config = paramsBurbujas(n, p.dificultad, p.tipoNivel === 'reto');
  const tablero = crearTablero(config.filas, config.colores, rng);
  let disparos = config.disparos;
  let extraUsado = false;
  let actual = colorParaLanzar(tablero, rng);
  let siguiente = colorParaLanzar(tablero, rng);
  let angulo: number | null = null;
  let pistaAngulo: number | null = null;
  let volando: { puntos: Array<{ x: number; y: number }>; avance: number; color: number; celda: Celda } | null = null;
  const animadas: Animada[] = [];
  let terminado = false;
  let temporizadorPista: number | undefined;
  let r = 20;

  const talentos = chipTalentos();
  const lienzo = h('canvas', { class: 'lienzo-burbujas', role: 'img', 'aria-label': 'Tablero de burbujas. Mantén el dedo para apuntar y suelta para disparar.' }) as HTMLCanvasElement;
  const zona = h('div', { class: 'zona-bolitas' }, lienzo);
  const estado = h('div', { class: 'objetivos-bolitas', 'aria-live': 'polite' });
  const subtitulo = [p.tipoNivel === 'reto' ? '⭐ Nivel reto · premio doble' : '', `${MODALIDADES.burbujas.icono} ${MODALIDADES.burbujas.nombre}`]
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
    estado,
    zona,
  );

  function pintarEstado(): void {
    const quedan = tablero.filas.flat().filter((x) => x !== null).length;
    estado.replaceChildren(
      h('div', { class: 'objetivo', 'aria-label': `Quedan ${quedan} burbujas` }, h('span', { 'aria-hidden': 'true', text: '🫧' }), h('span', { text: `${quedan}` })),
      h(
        'div',
        { class: `movimientos${disparos <= 3 ? ' pocos' : ''}`, 'aria-label': `Quedan ${disparos} disparos` },
        h('span', { 'aria-hidden': 'true', text: '🎯' }),
        h('strong', { text: String(disparos) }),
        h('span', { class: 'mov-texto', text: ' disparos' }),
      ),
    );
  }

  /* ---------- Dibujo ---------- */

  const ctx = lienzo.getContext('2d')!;
  let dibujoPedido = false;
  function pedirDibujo(): void {
    if (dibujoPedido) return;
    dibujoPedido = true;
    requestAnimationFrame(cuadro);
  }

  function bola(x: number, y: number, color: number, escala = 1, alfa = 1): void {
    const c = COLORES[color];
    const rad = r * 0.93 * escala;
    const px = x * r;
    const py = y * r;
    ctx.globalAlpha = alfa;
    const g = ctx.createRadialGradient(px - rad * 0.35, py - rad * 0.4, rad * 0.1, px, py, rad);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, c.fondo);
    g.addColorStop(1, c.oscuro);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.tinta;
    ctx.font = `700 ${Math.round(rad * 0.85)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.simbolo, px, py + rad * 0.05);
    ctx.globalAlpha = 1;
  }

  function lineaPuntos(ang: number, alfa: number): void {
    const tr = trayectoria(tablero, COLUMNAS, Y_LANZADOR, ang);
    ctx.fillStyle = `rgba(29, 78, 137, ${alfa})`;
    let restante = 0;
    for (let i = 1; i < tr.puntos.length; i++) {
      const a = tr.puntos[i - 1];
      const b = tr.puntos[i];
      const largo = Math.hypot(b.x - a.x, b.y - a.y);
      for (let d = restante; d < largo; d += 1.1) {
        ctx.beginPath();
        ctx.arc((a.x + ((b.x - a.x) * d) / largo) * r, (a.y + ((b.y - a.y) * d) / largo) * r, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
      restante = 0;
    }
    if (tr.celda) {
      const c = centro(tr.celda.f, tr.celda.c);
      ctx.strokeStyle = `rgba(29, 78, 137, ${alfa})`;
      ctx.lineWidth = Math.max(2, r * 0.12);
      ctx.setLineDash([r * 0.3, r * 0.25]);
      ctx.beginPath();
      ctx.arc(c.x * r, c.y * r, r * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  let ultimo = performance.now();
  function cuadro(ahora: number): void {
    dibujoPedido = false;
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    const w = lienzo.width / (window.devicePixelRatio || 1);
    const hgt = lienzo.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, hgt);
    // Línea de peligro.
    ctx.strokeStyle = 'rgba(192, 57, 43, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(0, (FONDO_TABLERO - ALTO_FILA) * r);
    ctx.lineTo(anchoTablero() * r, (FONDO_TABLERO - ALTO_FILA) * r);
    ctx.stroke();
    ctx.setLineDash([]);

    tablero.filas.forEach((fila, f) =>
      fila.forEach((col, c) => {
        if (col === null) return;
        const p = centro(f, c);
        bola(p.x, p.y, col);
      }),
    );

    if (!volando && !terminado) {
      if (angulo !== null) lineaPuntos(angulo, 0.8);
      else if (pistaAngulo !== null) lineaPuntos(pistaAngulo, 0.35);
    }

    // Lanzador: actual y siguiente.
    ctx.fillStyle = 'rgba(110, 74, 42, 0.18)';
    ctx.beginPath();
    ctx.arc(COLUMNAS * r, Y_LANZADOR * r, r * 1.5, 0, Math.PI * 2);
    ctx.fill();
    if (!volando) bola(COLUMNAS, Y_LANZADOR, actual);
    bola(COLUMNAS + 3.2, Y_LANZADOR + 0.4, siguiente, 0.7);
    ctx.fillStyle = '#4a3f33';
    ctx.font = `${Math.round(r * 0.55)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('siguiente', (COLUMNAS + 3.2) * r, (Y_LANZADOR + 1.5) * r);

    let sigue = false;
    if (volando) {
      sigue = true;
      volando.avance += dt * 38;
      let restante = volando.avance;
      let pos = volando.puntos[volando.puntos.length - 1];
      let llego = true;
      for (let i = 1; i < volando.puntos.length; i++) {
        const a = volando.puntos[i - 1];
        const b = volando.puntos[i];
        const largo = Math.hypot(b.x - a.x, b.y - a.y);
        if (restante <= largo) {
          pos = { x: a.x + ((b.x - a.x) * restante) / largo, y: a.y + ((b.y - a.y) * restante) / largo };
          llego = false;
          break;
        }
        restante -= largo;
      }
      bola(pos.x, pos.y, volando.color);
      if (llego || app.g.config.animacionesReducidas) aterrizar();
    }

    for (let i = animadas.length - 1; i >= 0; i--) {
      const a = animadas[i];
      a.t += dt;
      if (a.tipo === 'revienta') {
        bola(a.x, a.y, a.color, 1 + a.t * 1.5, Math.max(0, 1 - a.t * 4));
        if (a.t > 0.25) animadas.splice(i, 1);
      } else {
        a.vy += dt * 60;
        a.y += a.vy * dt;
        bola(a.x, a.y, a.color, 1, Math.max(0, 1 - a.t));
        if (a.t > 1) animadas.splice(i, 1);
      }
      sigue = true;
    }
    if (sigue) pedirDibujo();
  }

  function distribuir(): void {
    const caja = zona.getBoundingClientRect();
    if (caja.width < 10 || caja.height < 10) return;
    r = Math.max(10, Math.min(caja.width / anchoTablero(), caja.height / ALTO_TOTAL, 34));
    const dpr = window.devicePixelRatio || 1;
    const w = anchoTablero() * r;
    const hgt = ALTO_TOTAL * r;
    lienzo.style.width = `${w}px`;
    lienzo.style.height = `${hgt}px`;
    lienzo.width = Math.round(w * dpr);
    lienzo.height = Math.round(hgt * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pedirDibujo();
  }

  /* ---------- Apuntar y disparar ---------- */

  function anguloHacia(ev: PointerEvent): number {
    const caja = lienzo.getBoundingClientRect();
    const x = (ev.clientX - caja.left) / r;
    const y = (ev.clientY - caja.top) / r;
    const a = Math.atan2(Math.min(y - Y_LANZADOR, -0.3), x - COLUMNAS);
    return Math.max(ANGULO_MIN, Math.min(ANGULO_MAX, a));
  }

  function tocaLanzador(ev: PointerEvent): boolean {
    const caja = lienzo.getBoundingClientRect();
    const x = (ev.clientX - caja.left) / r;
    const y = (ev.clientY - caja.top) / r;
    return Math.hypot(x - COLUMNAS, y - Y_LANZADOR) < 1.6 || Math.hypot(x - COLUMNAS - 3.2, y - Y_LANZADOR - 0.4) < 1.2;
  }

  lienzo.addEventListener('pointerdown', (ev) => {
    if (volando || terminado || hayModalAbierto()) return;
    reiniciarPista();
    if (tocaLanzador(ev)) {
      // Tocar el lanzador intercambia la burbuja actual con la siguiente.
      [actual, siguiente] = [siguiente, actual];
      audio.efecto('boton');
      pedirDibujo();
      return;
    }
    lienzo.setPointerCapture(ev.pointerId);
    angulo = anguloHacia(ev);
    pedirDibujo();
  });
  lienzo.addEventListener('pointermove', (ev) => {
    if (angulo === null) return;
    angulo = anguloHacia(ev);
    pedirDibujo();
  });
  lienzo.addEventListener('pointerup', () => {
    if (angulo === null) return;
    const a = angulo;
    angulo = null;
    disparar(a);
  });
  lienzo.addEventListener('pointercancel', () => {
    angulo = null;
    pedirDibujo();
  });

  function disparar(a: number): void {
    if (volando || terminado || disparos <= 0) return;
    const tr = trayectoria(tablero, COLUMNAS, Y_LANZADOR, a);
    if (!tr.celda) return;
    disparos--;
    pistaAngulo = null;
    audio.efecto('toc');
    const destino = centro(tr.celda.f, tr.celda.c);
    volando = { puntos: [...tr.puntos, destino], avance: 0, color: actual, celda: tr.celda };
    actual = siguiente;
    siguiente = colorParaLanzar(tablero, rng);
    pintarEstado();
    pedirDibujo();
  }

  function aterrizar(): void {
    if (!volando) return;
    const { celda, color } = volando;
    volando = null;
    const res = colocar(tablero, celda, color);
    const caja = lienzo.getBoundingClientRect();
    for (const c of res.reventadas) {
      const p = centro(c.f, c.c);
      animadas.push({ x: p.x, y: p.y, color, t: 0, vy: 0, tipo: 'revienta' });
      efectos.destellos(caja.left + p.x * r, caja.top + p.y * r, COLORES[color].fondo);
    }
    for (const c of res.caidas) {
      const p = centro(c.f, c.c);
      animadas.push({ x: p.x, y: p.y, color: c.color, t: 0, vy: -4, tipo: 'cae' });
    }
    if (res.reventadas.length) audio.efecto('trio');
    // Si el color actual ya no está en el tablero, se cambia por uno que sí esté.
    const quedan = new Set(tablero.filas.flat());
    if (!quedan.has(actual) && !vacio(tablero)) actual = colorParaLanzar(tablero, rng);
    if (!quedan.has(siguiente) && !vacio(tablero)) siguiente = colorParaLanzar(tablero, rng);
    pintarEstado();
    pedirDibujo();
    if (vacio(tablero)) void ganar();
    else if (res.tocaFondo) perder(true);
    else if (disparos <= 0) perder(false);
    else reiniciarPista();
  }

  /* ---------- Pista ---------- */

  function mejorAngulo(): number | null {
    let respaldo: number | null = null;
    for (let a = ANGULO_MIN; a < ANGULO_MAX; a += 0.02) {
      const tr = trayectoria(tablero, COLUMNAS, Y_LANZADOR, a);
      if (!tr.celda) continue;
      const iguales = vecinos(tr.celda.f, tr.celda.c).filter((v) => tablero.filas[v.f][v.c] === actual).length;
      if (iguales >= 2) return a;
      if (iguales === 1 && respaldo === null) respaldo = a;
    }
    return respaldo;
  }

  function reiniciarPista(): void {
    window.clearTimeout(temporizadorPista);
    pistaAngulo = null;
    if (!app.g.config.ayudaAutomatica || terminado) return;
    temporizadorPista = window.setTimeout(() => {
      if (volando || terminado || angulo !== null) return;
      pistaAngulo = mejorAngulo();
      pedirDibujo();
    }, ESPERA_PISTA_MS);
  }

  /* ---------- Fin ---------- */

  async function ganar(): Promise<void> {
    terminado = true;
    window.clearTimeout(temporizadorPista);
    const proporcion = disparos / config.disparos;
    const estrellas = extraUsado ? 1 : proporcion >= 0.3 ? 3 : proporcion >= 0.12 ? 2 : 1;
    await celebrarNivel({ n, estrellas, p, alGuardar: () => talentos.refrescar() });
  }

  function perder(tocaFondo: boolean): void {
    window.clearTimeout(temporizadorPista);
    app.g.fallos[n] = (app.g.fallos[n] ?? 0) + 1;
    app.guardar();
    audio.efecto('aviso');
    const acciones = h('div', { class: 'pila' });
    if (!extraUsado) {
      const texto = tocaFondo ? 'Responder una pregunta: quitar las filas de abajo' : `Responder una pregunta: +${DISPAROS_EXTRA} disparos`;
      const b = boton(texto, async () => {
        modal.cerrar();
        const acerto = await abrirPregunta({
          titulo: '❓ Una ayudita',
          premio: tocaFondo ? 'Responde y quitamos las burbujas de abajo.' : `Responde y recibe ${DISPAROS_EXTRA} disparos más.`,
          resultado: (ok) => (tocaFondo ? '¡Listo, quitamos las filas de abajo!' : ok ? `+${DISPAROS_EXTRA} disparos` : `+${DISPAROS_EXTRA - 2} disparos`),
          autoCerrarMs: 3000,
        });
        extraUsado = true;
        if (tocaFondo) {
          for (let f = FILAS - 4; f < FILAS; f++) for (let c = 0; c < columnasDeFila(f); c++) tablero.filas[f][c] = null;
          disparos = Math.max(disparos, DISPAROS_EXTRA);
        } else {
          disparos += acerto ? DISPAROS_EXTRA : DISPAROS_EXTRA - 2;
        }
        pintarEstado();
        pedirDibujo();
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
      contenido: h(
        'div',
        { class: 'pila' },
        h('p', { class: 'texto-grande', text: tocaFondo ? 'Las burbujas llegaron abajo.' : 'Se terminaron los disparos.' }),
        acciones,
      ),
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
        h('p', { class: 'texto-suave', text: 'Mantén el dedo sobre el tablero para apuntar y suéltalo para disparar. Toca la burbuja de abajo para cambiarla por la siguiente.' }),
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
    if (hayModalAbierto()) return;
    if (ev.key === 'Escape') abrirPausa();
    // Teclado: flechas para apuntar, Enter o espacio para disparar.
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      angulo = Math.max(ANGULO_MIN, Math.min(ANGULO_MAX, (angulo ?? -Math.PI / 2) + (ev.key === 'ArrowLeft' ? -0.06 : 0.06)));
      pedirDibujo();
    } else if ((ev.key === 'Enter' || ev.key === ' ') && angulo !== null) {
      ev.preventDefault();
      const a = angulo;
      angulo = null;
      disparar(a);
    }
  };
  document.addEventListener('keydown', alTeclear);

  const observador = new ResizeObserver(() => distribuir());
  observador.observe(zona);
  pintarEstado();
  requestAnimationFrame(() => {
    distribuir();
    setTimeout(() => mostrarAnimo(`${MODALIDADES.burbujas.icono} ${MODALIDADES.burbujas.nombre}`), 250);
    if (!app.g.estrellas[n]) avisar('Mantén el dedo para apuntar y suelta para disparar.', 3000);
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
