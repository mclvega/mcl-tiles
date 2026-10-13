import { app, type Pantalla } from '../app';
import { audio } from '../audio';
import { NIVELES_POR_LIBRO, LIBROS, ubicarNivel } from '../content/books';
import { FICHAS_POR_ID, poolDeVuelta, svgFicha } from '../content/tiles';
import { claveDia, protagonistaDe, versiculoDeNivel } from '../content/verses';
import { paramsNivel } from '../core/difficulty';
import { Partida, type EstadoPartida } from '../core/game';
import { generarTablero } from '../core/generator';
import { mulberry32 } from '../core/rng';
import { AYUDAS, ORDEN_AYUDAS, type IdAyuda } from '../economy/shop';
import {
  PREMIOS,
  ayudaAlAzar,
  gastarTalentos,
  ganaTalentosRestantes,
  premioNivel,
  registrarGanaTalentos,
  sumarTalentos,
} from '../economy/wallet';
import { efectos } from '../fx/loop';
import { voz } from '../speech';
import { chipTalentos, mostrarAnimo, tarjetaVersiculo } from './componentes';
import { panelConfiguracion } from './configuracion';
import { abrirModal, avisar, boton, confirmar, esperar, h, hayModalAbierto, type Modal } from './dom';
import { abrirPregunta } from './pregunta';

const ANIMOS = ['¡Muy bien, {n}!', '¡Excelente!', '¡Así se hace!', '¡Gloria a Dios!', '¡Sigue así, {n}!', '¡Qué bendición!'];
const ESPERA_PISTA_MS = 15000;
const DESPLAZAMIENTO_CAPA = 0.08;

export function pantallaJuego(params: Record<string, unknown>): Pantalla {
  const g = app.g;
  const n = Math.max(1, Math.min(Number(params.nivel) || g.nivelActual, g.nivelActual));
  const ub = ubicarNivel(n);
  const masFacil = g.masFacil.includes(n);
  const p = paramsNivel(n, g.config.dificultad, masFacil);
  const pool = poolDeVuelta(ub.vuelta);
  const versiculo = versiculoDeNivel(n);
  const tablero = generarTablero(p, { pool, protagonista: protagonistaDe(versiculo, pool) });
  const partida = new Partida(tablero, p.bandeja);

  let ayudasGratis = p.ayudasGratis;
  let ocupado = false;
  let terminado = false;
  let temporizadorPista: number | undefined;
  let avisoBandejaMostrado = false;
  let triosHechos = 0;
  let avisoTapadaMostrado = false;
  let mensajeEsAlerta = false;
  const tutorial = n <= 3;
  const reducidas = () => app.g.config.animacionesReducidas;

  /* ---------- Estructura ---------- */

  const talentos = chipTalentos();
  const textoMensaje = h('p');
  const botonOirMensaje = h('button', {
    type: 'button',
    class: 'btn btn-suave',
    'aria-label': 'Escuchar el mensaje',
    text: '🔊',
    onclick: () => voz.hablar(textoMensaje.textContent ?? ''),
  });
  const mensaje = h('div', { class: 'mensaje-juego', role: 'status', 'aria-live': 'polite' }, textoMensaje, botonOirMensaje);
  const tableroEl = h('div', { class: 'tablero', role: 'group', 'aria-label': `Tablero del nivel ${n}` });
  const zonaTablero = h('div', { class: 'zona-tablero' }, tableroEl);
  const bandejaEl = h('div', { class: 'bandeja', role: 'list', 'aria-label': 'Bandeja' });
  const estadoBandeja = h('p', { class: 'estado-bandeja', 'aria-live': 'polite' });
  const ayudasEl = h('div', { class: 'ayudas', role: 'group', 'aria-label': 'Ayudas' });

  const subtitulo =
    `${ub.nombreLibro} · ${ub.nivelEnLibro} de ${NIVELES_POR_LIBRO}` +
    (p.tipoNivel === 'especial' ? ' · ⭐ Nivel especial: premio doble' : '') +
    (p.tipoNivel === 'descanso' ? ' · 🌿 Nivel de descanso' : '') +
    (masFacil ? ' · 🙂 Versión más fácil' : '');

  const el = h(
    'main',
    { class: 'juego' },
    h(
      'header',
      { class: 'barra-juego' },
      boton('Pausa', () => abrirPausa(), { icono: '⏸', variante: 'secundario' }),
      h('div', { class: 'titulo-nivel' }, h('h1', { text: `Nivel ${n}` }), h('span', { text: subtitulo })),
      talentos.el,
    ),
    mensaje,
    zonaTablero,
    h('div', { class: 'zona-bandeja' }, bandejaEl, estadoBandeja),
    ayudasEl,
  );

  /* ---------- Fichas del tablero ---------- */

  const elementos = new Map<number, HTMLButtonElement>();
  const nombreFicha = (id: number) => FICHAS_POR_ID.get(partida.tipo(id))?.nombre ?? 'Ficha';
  for (const f of tablero.fichas) {
    const b = h('button', {
      type: 'button',
      class: 'ficha',
      dataset: { id: String(f.id) },
      html: svgFicha(f.tipo),
      onclick: () => void elegir(f.id),
    });
    elementos.set(f.id, b);
    tableroEl.append(b);
  }

  function distribuir(): void {
    const zona = zonaTablero.getBoundingClientRect();
    if (zona.width < 10 || zona.height < 10) return;
    const capas = tablero.capas;
    const cols = tablero.ancho / 2;
    const filas = tablero.alto / 2;
    const extra = (capas - 1) * DESPLAZAMIENTO_CAPA;
    const tw = Math.max(30, Math.min(118, (zona.width - 8) / (cols + extra), (zona.height - 14) / (filas * 1.15 + extra + 0.1)));
    const th = tw * 1.15;
    const s = tw * DESPLAZAMIENTO_CAPA;
    tableroEl.style.width = `${cols * tw + (capas - 1) * s}px`;
    tableroEl.style.height = `${filas * th + (capas - 1) * s + tw * 0.1}px`;
    for (const f of tablero.fichas) {
      const b = elementos.get(f.id)!;
      const corrimiento = (capas - 1 - f.z) * s;
      b.style.left = `${(f.x / 2) * tw + corrimiento}px`;
      b.style.top = `${(f.y / 2) * th + corrimiento}px`;
      b.style.width = `${tw}px`;
      b.style.height = `${th}px`;
      b.style.zIndex = String(f.z * 1000 + f.y * 10 + f.x);
      b.style.setProperty('--canto', `${Math.max(3, tw * 0.07)}px`);
    }
    const anchoDisponible = Math.min(window.innerWidth - 32, 980);
    const cap = partida.capacidad;
    const tam = Math.max(26, Math.min(tw, 82, (anchoDisponible - 28 - 8 * (cap - 1)) / cap));
    bandejaEl.style.setProperty('--tam-bandeja', `${tam}px`);
  }

  function refrescarLibres(): void {
    for (const f of tablero.fichas) {
      const b = elementos.get(f.id)!;
      if (!partida.enTablero[f.id]) {
        b.classList.add('oculta');
        b.tabIndex = -1;
        continue;
      }
      b.classList.remove('oculta');
      const libre = partida.esLibre(f.id);
      b.classList.toggle('libre', libre);
      b.classList.toggle('bloqueada', !libre);
      b.tabIndex = libre ? 0 : -1;
      b.setAttribute('aria-disabled', String(!libre));
      b.setAttribute('aria-label', libre ? nombreFicha(f.id) : `${nombreFicha(f.id)} (tapada)`);
    }
  }

  /* ---------- Bandeja ---------- */

  function pintarBandeja(lista: number[], ocultar?: number, ranuraNueva = false): void {
    const antes = new Map<number, DOMRect>();
    bandejaEl.querySelectorAll<HTMLElement>('.ficha-bandeja').forEach((e) => antes.set(Number(e.dataset.id), e.getBoundingClientRect()));
    bandejaEl.replaceChildren();
    for (let i = 0; i < partida.capacidad; i++) {
      const ranura = h('div', { class: `ranura${ranuraNueva && i === partida.capacidad - 1 ? ' nueva' : ''}`, role: 'listitem' });
      const id = lista[i];
      if (id !== undefined) {
        const fb = h('div', { class: 'ficha-bandeja', dataset: { id: String(id) }, html: svgFicha(partida.tipo(id)), 'aria-label': nombreFicha(id) });
        if (id === ocultar) fb.style.visibility = 'hidden';
        ranura.append(fb);
      }
      bandejaEl.append(ranura);
    }
    if (!reducidas()) {
      bandejaEl.querySelectorAll<HTMLElement>('.ficha-bandeja').forEach((fb) => {
        const previo = antes.get(Number(fb.dataset.id));
        if (!previo) return;
        const ahora = fb.getBoundingClientRect();
        const dx = previo.left - ahora.left;
        if (Math.abs(dx) > 1) fb.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 220, easing: 'ease-out' });
      });
    }
    const libres = partida.capacidad - lista.length;
    const casiLlena = app.g.config.avisoBandeja && lista.length > 0 && libres <= 2;
    bandejaEl.classList.toggle('casi-llena', casiLlena);
    estadoBandeja.textContent = `Bandeja: ${lista.length} de ${partida.capacidad} espacios ocupados`;
  }

  function volar(desde: DOMRect, hasta: Element | null | undefined, tipo: string): Promise<void> {
    if (!hasta || reducidas()) return Promise.resolve();
    const destino = hasta.getBoundingClientRect();
    const clon = h('div', {
      class: 'ficha-volando',
      html: svgFicha(tipo),
      style: {
        left: `${desde.left}px`,
        top: `${desde.top}px`,
        width: `${desde.width}px`,
        height: `${desde.height}px`,
        transformOrigin: '0 0',
      },
    });
    document.body.append(clon);
    const dx = destino.left - desde.left;
    const dy = destino.top - desde.top;
    const sx = destino.width / desde.width;
    const sy = destino.height / desde.height;
    const anim = clon.animate(
      [
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) scale(${(1 + sx) / 2}, ${(1 + sy) / 2})`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
      ],
      { duration: 330, easing: 'ease-in-out' },
    );
    return anim.finished.then(
      () => clon.remove(),
      () => clon.remove(),
    );
  }

  async function animarSalida(ids: number[]): Promise<void> {
    const els = ids
      .map((id) => bandejaEl.querySelector<HTMLElement>(`.ficha-bandeja[data-id="${id}"]`))
      .filter((e): e is HTMLElement => !!e);
    for (const e of els) {
      const r = e.getBoundingClientRect();
      efectos.destellos(r.left + r.width / 2, r.top + r.height / 2);
      e.classList.add('sale');
    }
    audio.efecto('trio');
    if (!reducidas()) await esperar(380);
  }

  /* ---------- Mensajes y tutorial ---------- */

  function setMensaje(texto: string, opciones: { alerta?: boolean; hablar?: boolean } = {}): void {
    textoMensaje.textContent = texto;
    mensaje.classList.add('visible');
    mensaje.classList.toggle('alerta', !!opciones.alerta);
    mensajeEsAlerta = !!opciones.alerta;
    botonOirMensaje.hidden = !app.vozActiva();
    if (opciones.hablar && app.vozActiva()) voz.hablar(texto);
    requestAnimationFrame(distribuir);
  }

  function ocultarMensaje(): void {
    if (!mensaje.classList.contains('visible')) return;
    mensaje.classList.remove('visible', 'alerta');
    mensajeEsAlerta = false;
    requestAnimationFrame(distribuir);
  }

  let mano: HTMLElement | null = null;
  function quitarPista(): void {
    tableroEl.querySelectorAll('.pista').forEach((e) => e.classList.remove('pista'));
    mano?.remove();
    mano = null;
  }

  function mostrarPista(conMano = false): void {
    quitarPista();
    const ids = partida.pista();
    ids.forEach((id) => elementos.get(id)?.classList.add('pista'));
    if (conMano && ids.length) {
      const objetivo = elementos.get(ids[0])!;
      mano = h('span', { class: 'mano', 'aria-hidden': 'true', text: '👆' });
      mano.style.left = `calc(${objetivo.style.left} + ${parseFloat(objetivo.style.width) * 0.35}px)`;
      mano.style.top = `calc(${objetivo.style.top} + ${parseFloat(objetivo.style.height) * 0.55}px)`;
      tableroEl.append(mano);
    }
  }

  function reiniciarPista(): void {
    window.clearTimeout(temporizadorPista);
    if (!app.g.config.ayudaAutomatica || terminado) return;
    temporizadorPista = window.setTimeout(() => {
      if (!terminado && !ocupado && partida.estado === 'jugando') mostrarPista();
    }, ESPERA_PISTA_MS);
  }

  function pasoTutorial(): void {
    if (!tutorial || terminado) return;
    const nombre = app.nombre();
    if (n === 1) {
      if (triosHechos === 0 && partida.bandeja.length === 0) {
        setMensaje(`👆 Haz clic en una ficha que brille, ${nombre}. Las fichas con borde dorado están libres.`, { hablar: true });
        mostrarPista(true);
      } else if (triosHechos === 0) {
        setMensaje('¡Muy bien! La ficha pasó a la bandeja de abajo. Ahora elige otra igual.', { hablar: true });
        mostrarPista(true);
      } else if (triosHechos === 1) {
        setMensaje('¡Excelente! Tres fichas iguales desaparecen. Sigue así hasta vaciar el tablero.', { hablar: true });
      } else ocultarMensaje();
    } else if (n === 2) {
      if (triosHechos === 0 && partida.bandeja.length === 0) {
        setMensaje(`La bandeja tiene ${partida.capacidad} espacios. Si se llena, puedes intentarlo otra vez. ¡Sin prisa!`, { hablar: true });
      } else if (triosHechos >= 1) ocultarMensaje();
    } else if (n === 3) {
      // Sin mensaje: en celulares con letra grande tapaba demasiado el tablero.
      if (triosHechos === 0 && partida.bandeja.length === 0) mostrarPista(true);
    }
  }

  function revisarAvisoBandeja(): void {
    const libres = partida.espaciosLibres();
    if (app.g.config.avisoBandeja && partida.estado === 'jugando' && partida.bandeja.length > 0 && libres <= 2) {
      if (!avisoBandejaMostrado) {
        avisoBandejaMostrado = true;
        audio.efecto('aviso');
        setMensaje('¡Cuidado, la bandeja casi está llena! Busca fichas iguales a las de la bandeja.', { alerta: true });
      }
    } else {
      avisoBandejaMostrado = false;
      if (mensajeEsAlerta) ocultarMensaje();
    }
  }

  /* ---------- Jugadas ---------- */

  async function elegir(id: number): Promise<void> {
    if (ocupado || terminado || partida.estado !== 'jugando') return;
    const b = elementos.get(id)!;
    if (!partida.esLibre(id)) {
      audio.efecto('bloqueada');
      b.classList.remove('tiembla');
      void b.offsetWidth;
      b.classList.add('tiembla');
      if (!avisoTapadaMostrado) {
        avisoTapadaMostrado = true;
        avisar('Esa ficha está tapada. Elige una con borde dorado.');
      }
      return;
    }
    ocupado = true;
    quitarPista();
    const desde = b.getBoundingClientRect();
    const antes = [...partida.bandeja];
    const r = partida.elegir(id)!;
    audio.efecto('toc');
    b.classList.add('oculta');
    refrescarLibres();
    const visual = [...antes];
    visual.splice(r.indice, 0, id);
    pintarBandeja(visual, id);
    const destino = bandejaEl.querySelector<HTMLElement>(`.ficha-bandeja[data-id="${id}"]`);
    await volar(desde, destino, partida.tipo(id));
    if (destino) destino.style.visibility = '';
    if (r.trio) {
      await animarSalida(r.trio);
      triosHechos++;
      if (triosHechos === 1 || triosHechos % 2 === 0) mostrarAnimo(ANIMOS[triosHechos % ANIMOS.length].replace('{n}', app.nombre()));
      pintarBandeja(partida.bandeja);
    }
    ocupado = false;
    refrescarAyudas();
    revisarAvisoBandeja();
    pasoTutorial();
    reiniciarPista();
    comprobarFin(r.estado);
  }

  function comprobarFin(estado: EstadoPartida): void {
    if (estado === 'ganado') void victoria();
    else if (estado === 'perdido') casiLoLogras(true);
  }

  /* ---------- Ayudas ---------- */

  function puedeUsar(id: IdAyuda): string | null {
    if (id === 'deshacer' && !partida.puedeDeshacer()) return 'No hay una ficha para devolver ahora.';
    if (id === 'espacio' && !partida.puedeAgrandar()) return 'La bandeja ya tiene el máximo de espacios.';
    if ((id === 'barajar' || id === 'lampara') && partida.estado !== 'jugando') return 'Primero libera espacio en la bandeja.';
    return null;
  }

  function refrescarAyudas(): void {
    ayudasEl.replaceChildren(
      ...ORDEN_AYUDAS.map((id) => {
        const info = AYUDAS[id];
        const tiene = app.g.ayudas[id];
        const etiqueta = ayudasGratis > 0 ? `Gratis ×${ayudasGratis}` : tiene > 0 ? `×${tiene}` : `🪙${info.precio}`;
        return h(
          'button',
          {
            type: 'button',
            class: 'ayuda',
            disabled: puedeUsar(id) !== null && !(id === 'barajar' || id === 'lampara'),
            title: info.descripcion,
            'aria-label': `${info.nombre}: ${info.descripcion} (${etiqueta})`,
            onclick: () => void usarAyuda(id),
          },
          h('span', { class: 'icono', 'aria-hidden': 'true', text: info.icono }),
          h('span', { text: info.nombre }),
          h('span', { class: `cuenta ${ayudasGratis > 0 ? 'gratis' : ''}`, 'aria-hidden': 'true', text: etiqueta }),
        );
      }),
    );
  }

  async function ofrecerCanje(id: IdAyuda): Promise<boolean> {
    const info = AYUDAS[id];
    if (app.g.talentos >= info.precio) {
      const ok = await confirmar(
        `${info.icono} ${info.nombre}`,
        `No te quedan ayudas de este tipo. ¿Canjear ${info.precio} talentos por una? Tienes ${app.g.talentos}.`,
        `Sí, canjear ${info.precio} 🪙`,
      );
      if (ok && gastarTalentos(app.g, info.precio)) {
        audio.efecto('canje');
        talentos.refrescar();
        return true;
      }
      return false;
    }
    const restantes = ganaTalentosRestantes(app.g, claveDia());
    const contenido = h(
      'div',
      { class: 'pila' },
      h('p', { class: 'texto-grande', text: `Te faltan ${info.precio - app.g.talentos} talentos para «${info.nombre}».` }),
      h('p', { text: 'Ganas talentos al completar niveles y al responder preguntas bíblicas.' }),
    );
    const fila = h('div', { class: 'fila-botones' });
    if (restantes > 0) {
      fila.append(
        boton(`Responder una pregunta (+${PREMIOS.ganaTalentos.acierto} 🪙)`, async () => {
          modal.cerrar();
          const acerto = await abrirPregunta({
            titulo: '🙋 Gana talentos',
            premio: `Responde y gana ${PREMIOS.ganaTalentos.acierto} talentos.`,
            resultado: (ok) => `+${ok ? PREMIOS.ganaTalentos.acierto : PREMIOS.ganaTalentos.error} talentos 🪙`,
          });
          sumarTalentos(app.g, acerto ? PREMIOS.ganaTalentos.acierto : PREMIOS.ganaTalentos.error);
          registrarGanaTalentos(app.g, claveDia());
          app.guardar();
          talentos.refrescar();
        }, { variante: 'primario', icono: '❓' }),
      );
    }
    fila.append(boton('Seguir jugando', () => modal.cerrar(), { variante: 'secundario' }));
    contenido.append(fila);
    const modal = abrirModal({ titulo: 'Faltan talentos', contenido });
    return false;
  }

  async function usarAyuda(id: IdAyuda): Promise<boolean> {
    if (ocupado || terminado) return false;
    const motivo = puedeUsar(id);
    if (motivo) {
      avisar(motivo);
      return false;
    }
    let fuente: 'gratis' | 'inventario' | 'canje';
    if (ayudasGratis > 0) {
      ayudasGratis--;
      fuente = 'gratis';
    } else if (app.g.ayudas[id] > 0) {
      app.g.ayudas[id]--;
      fuente = 'inventario';
    } else {
      if (!(await ofrecerCanje(id))) return false;
      fuente = 'canje';
    }
    ocupado = true;
    quitarPista();
    const ok = await efectoAyuda(id);
    ocupado = false;
    if (!ok) {
      if (fuente === 'gratis') ayudasGratis++;
      else app.g.ayudas[id]++;
    } else if (fuente !== 'gratis') {
      partida.ayudasUsadas++;
    }
    app.guardar();
    talentos.refrescar();
    refrescarAyudas();
    revisarAvisoBandeja();
    reiniciarPista();
    if (ok) comprobarFin(partida.estado);
    return ok;
  }

  async function efectoAyuda(id: IdAyuda): Promise<boolean> {
    switch (id) {
      case 'deshacer': {
        const previo = new Map<number, DOMRect>();
        bandejaEl.querySelectorAll<HTMLElement>('.ficha-bandeja').forEach((e) => previo.set(Number(e.dataset.id), e.getBoundingClientRect()));
        const devuelta = partida.deshacer();
        if (devuelta === null) return false;
        audio.efecto('toc');
        await devolverAlTablero([devuelta], previo);
        return true;
      }
      case 'barajar': {
        const ok = partida.barajar(mulberry32(Date.now() >>> 0));
        if (!ok) {
          avisar('Ahora no se pudo mezclar. Prueba con otra ayuda.');
          return false;
        }
        audio.efecto('canje');
        for (const f of tablero.fichas) {
          if (!partida.enTablero[f.id]) continue;
          const b = elementos.get(f.id)!;
          b.innerHTML = svgFicha(f.tipo);
          b.classList.remove('gira');
          void b.offsetWidth;
          b.classList.add('gira');
        }
        refrescarLibres();
        avisar('🌬️ ¡Viento recio! Las fichas se mezclaron.');
        return true;
      }
      case 'lampara': {
        const r = partida.lampara();
        if (!r) return false;
        const destino = bandejaEl.getBoundingClientRect();
        const centro = new DOMRect(destino.left + destino.width / 2 - 30, destino.top + 5, 60, 70);
        const vuelos = r.desdeTablero.map((fid) => {
          const b = elementos.get(fid)!;
          const desde = b.getBoundingClientRect();
          b.classList.add('oculta');
          return volar(desde, { getBoundingClientRect: () => centro } as Element, r.tipo);
        });
        refrescarLibres();
        await Promise.all(vuelos);
        efectos.destellos(centro.left + 30, centro.top + 35);
        await animarSalida(r.desdeBandeja);
        if (!r.desdeBandeja.length) audio.efecto('trio');
        pintarBandeja(partida.bandeja);
        mostrarAnimo('🪔 ¡Trío completado!');
        return true;
      }
      case 'espacio': {
        if (!partida.agrandarBandeja()) return false;
        audio.efecto('canje');
        distribuir();
        pintarBandeja(partida.bandeja, undefined, true);
        avisar('⛺ ¡La bandeja tiene un espacio más!');
        return true;
      }
    }
  }

  async function devolverAlTablero(ids: number[], previo: Map<number, DOMRect>): Promise<void> {
    refrescarLibres();
    for (const fid of ids) elementos.get(fid)!.classList.add('oculta');
    pintarBandeja(partida.bandeja);
    await Promise.all(
      ids.map((fid) => {
        const desde = previo.get(fid);
        const b = elementos.get(fid)!;
        return desde ? volar(desde, b, partida.tipo(fid)) : Promise.resolve();
      }),
    );
    for (const fid of ids) {
      const b = elementos.get(fid)!;
      b.classList.remove('oculta');
      b.classList.add('aparece');
      setTimeout(() => b.classList.remove('aparece'), 400);
    }
    refrescarLibres();
  }

  /* ---------- Fin del nivel ---------- */

  async function abrirCofre(): Promise<void> {
    app.g.nivelesDesdeCofre = 0;
    app.guardar();
    const regalo = ayudaAlAzar(Math.random());
    const acerto = await abrirPregunta({
      titulo: '🎁 Cofre de bendiciones',
      premio: 'Responde esta pregunta para abrir el cofre.',
      resultado: (ok) =>
        ok
          ? `+${PREMIOS.cofre.acierto} talentos y una ayuda «${AYUDAS[regalo].nombre}» de regalo 🎁`
          : `+${PREMIOS.cofre.error} talentos 🪙`,
      textoContinuar: 'Seguir',
    });
    sumarTalentos(app.g, acerto ? PREMIOS.cofre.acierto : PREMIOS.cofre.error);
    if (acerto) app.g.ayudas[regalo]++;
    app.guardar();
  }

  async function victoria(): Promise<void> {
    terminado = true;
    window.clearTimeout(temporizadorPista);
    ocultarMensaje();
    const g = app.g;
    const estrellas = partida.estrellas();
    const premio = premioNivel(p, estrellas);
    const nuevo = n === g.nivelActual;
    g.estrellas[n] = Math.max(g.estrellas[n] ?? 0, estrellas);
    if (nuevo) {
      g.nivelActual = n + 1;
      g.nivelesDesdeCofre++;
    }
    sumarTalentos(g, premio);
    if (!g.versiculos.some((v) => v.nivel === n)) g.versiculos.unshift({ id: versiculo.id, nivel: n, fecha: claveDia() });
    delete g.fallos[n];
    app.guardar();
    talentos.refrescar();

    audio.efecto('victoria');
    audio.atenuar(true);
    efectos.celebracion();
    if (!reducidas()) await esperar(700);

    const cofrePendiente = nuevo && g.nivelesDesdeCofre >= PREMIOS.nivelesPorCofre;
    let finLibro: string | null = null;
    if (nuevo && ub.nivelEnLibro === NIVELES_POR_LIBRO) {
      finLibro =
        ub.libro === LIBROS.length - 1
          ? `🎉 ¡Completaste el recorrido por toda la Biblia! Empieza la vuelta ${ub.vuelta + 1} con fichas nuevas.`
          : `🎉 ¡Terminaste el libro de ${ub.nombreLibro}! Ahora sigue ${LIBROS[ub.libro + 1]}.`;
    }

    const salir = async (destino: 'siguiente' | 'inicio') => {
      modal.cerrar();
      if (cofrePendiente) await abrirCofre();
      if (destino === 'siguiente') app.ir('juego', { nivel: n + 1 });
      else app.ir('inicio');
    };

    const siguiente = boton('Siguiente nivel', () => void salir('siguiente'), { icono: '▶', variante: 'primario' });
    siguiente.dataset.focoInicial = '';
    const contenido = h(
      'div',
      { class: 'pila' },
      h(
        'p',
        { class: 'estrellas', 'aria-label': `${estrellas} de 3 estrellas` },
        ...[1, 2, 3].map((i) => h('span', { class: i <= estrellas ? '' : 'apagada', 'aria-hidden': 'true', text: '⭐' })),
      ),
      h('p', { class: 'texto-grande centrado', text: `¡Bien hecho, ${app.nombre()}!` }),
      h('p', { class: 'premio', text: `+${premio} talentos 🪙${p.tipoNivel === 'especial' ? ' (premio doble)' : ''}` }),
      finLibro ? h('p', { class: 'respuesta bien', text: finLibro }) : null,
      cofrePendiente ? h('p', { class: 'centrado', text: '🎁 ¡Ganaste un cofre de bendiciones! Se abre al continuar.' }) : null,
      h('p', { class: 'texto-suave centrado', text: 'Tu versículo para hoy:' }),
      tarjetaVersiculo(versiculo, { favorito: true }),
      h('div', { class: 'fila-botones' }, siguiente, boton('Inicio', () => void salir('inicio'), { icono: '🏠' })),
    );
    const modal = abrirModal({
      titulo: `¡Nivel ${n} completado!`,
      contenido,
      cerrable: false,
      alCerrar: () => audio.atenuar(false),
    });
  }

  function casiLoLogras(registrarFallo: boolean): void {
    window.clearTimeout(temporizadorPista);
    quitarPista();
    if (registrarFallo) {
      app.g.fallos[n] = (app.g.fallos[n] ?? 0) + 1;
      app.guardar();
      audio.efecto('aviso');
    }
    const fallos = app.g.fallos[n] ?? 0;
    const acciones = h('div', { class: 'pila' });
    const continuar = async (accion: () => Promise<boolean>) => {
      modal.cerrar();
      const ok = await accion();
      if (!ok || partida.estado === 'perdido') casiLoLogras(false);
    };

    if (!partida.segundaOportunidadUsada) {
      const b = boton('Responder una pregunta y seguir jugando', () => void continuar(segundaOportunidad), {
        icono: '❓',
        variante: 'primario',
        clase: 'btn-ancho',
      });
      b.dataset.focoInicial = '';
      acciones.append(b);
    }
    if (partida.puedeDeshacer()) {
      acciones.append(boton(`${AYUDAS.deshacer.nombre} (devolver la última ficha)`, () => void continuar(() => usarAyuda('deshacer')), { icono: AYUDAS.deshacer.icono, clase: 'btn-ancho' }));
    }
    if (partida.puedeAgrandar()) {
      acciones.append(boton(`${AYUDAS.espacio.nombre} (un espacio más)`, () => void continuar(() => usarAyuda('espacio')), { icono: AYUDAS.espacio.icono, clase: 'btn-ancho' }));
    }
    acciones.append(boton('Intentar de nuevo', () => {
      modal.cerrar();
      app.ir('juego', { nivel: n });
    }, { icono: '🔄', clase: 'btn-ancho' }));
    if (fallos >= 2 && !masFacil) {
      acciones.append(boton('Hacer este nivel más fácil', () => {
        app.g.masFacil.push(n);
        app.guardar();
        modal.cerrar();
        app.ir('juego', { nivel: n });
      }, { icono: '🙂', variante: 'suave', clase: 'btn-ancho' }));
    }
    acciones.append(boton('Volver al inicio', () => {
      modal.cerrar();
      app.ir('inicio');
    }, { icono: '🏠', variante: 'suave', clase: 'btn-ancho' }));

    const modal: Modal = abrirModal({
      titulo: `¡Casi lo logras, ${app.nombre()}!`,
      cerrable: false,
      contenido: h(
        'div',
        { class: 'pila' },
        h('p', { class: 'texto-grande', text: 'La bandeja se llenó. No te preocupes: ¿qué quieres hacer?' }),
        acciones,
      ),
    });
  }

  async function segundaOportunidad(): Promise<boolean> {
    const acerto = await abrirPregunta({
      titulo: '❓ Segunda oportunidad',
      premio: 'Responde y te devolvemos fichas al tablero para que sigas jugando.',
      resultado: (ok) => (ok ? 'Te devolvemos 3 fichas al tablero. ¡Adelante!' : 'Igual te devolvemos 2 fichas. ¡Adelante!'),
    });
    partida.segundaOportunidadUsada = true;
    partida.ayudasUsadas++;
    const previo = new Map<number, DOMRect>();
    bandejaEl.querySelectorAll<HTMLElement>('.ficha-bandeja').forEach((e) => previo.set(Number(e.dataset.id), e.getBoundingClientRect()));
    const devueltas = partida.devolverRecientes(acerto ? 3 : 2);
    await devolverAlTablero(devueltas, previo);
    refrescarAyudas();
    revisarAvisoBandeja();
    reiniciarPista();
    return devueltas.length > 0;
  }

  /* ---------- Pausa ---------- */

  function abrirPausa(): void {
    if (terminado || hayModalAbierto()) return;
    window.clearTimeout(temporizadorPista);
    const continuarBtn = boton('Continuar', () => modal.cerrar(), { icono: '▶', variante: 'primario', clase: 'btn-ancho' });
    continuarBtn.dataset.focoInicial = '';
    const modal = abrirModal({
      titulo: '⏸ Pausa',
      contenido: h(
        'div',
        { class: 'pila' },
        continuarBtn,
        boton('Reiniciar el nivel', async () => {
          modal.cerrar();
          if (await confirmar('Reiniciar el nivel', '¿Quieres empezar este nivel de nuevo?', 'Sí, reiniciar')) app.ir('juego', { nivel: n });
        }, { icono: '🔄', clase: 'btn-ancho' }),
        boton('Configuración', () => {
          modal.cerrar();
          abrirModal({
            titulo: '⚙️ Configuración',
            contenido: panelConfiguracion({ enJuego: true }),
            alCerrar: () => {
              distribuir();
              pintarBandeja(partida.bandeja);
              refrescarAyudas();
              reiniciarPista();
            },
          });
        }, { icono: '⚙️', clase: 'btn-ancho' }),
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

  /* ---------- Inicio ---------- */

  const observador = new ResizeObserver(() => distribuir());
  observador.observe(zonaTablero);
  refrescarLibres();
  pintarBandeja([]);
  refrescarAyudas();
  requestAnimationFrame(() => {
    distribuir();
    pasoTutorial();
    reiniciarPista();
    void app.ajustarCalidadAutomatica();
  });

  return {
    el,
    limpiar: () => {
      observador.disconnect();
      window.clearTimeout(temporizadorPista);
      document.removeEventListener('keydown', alTeclear);
      efectos.limpiar();
      audio.atenuar(false);
      document.querySelectorAll('.ficha-volando, .animo').forEach((e) => e.remove());
    },
  };
}
