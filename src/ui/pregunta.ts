import { app } from '../app';
import { audio } from '../audio';
import { opcionesBarajadas, preguntaNumero } from '../content/quiz';
import { voz } from '../speech';
import { abrirModal, agregar, boton, h } from './dom';

/** Tiempo tras responder en que se ignoran toques (evita cierres por doble toque). */
const ESPERA_TOQUE_MS = 900;

export interface OpcionesPregunta {
  titulo: string;
  /** Texto que explica el premio (se usa como descripción accesible). */
  premio: string;
  /** Texto del premio según la respuesta (se muestra después de responder). */
  resultado: (correcta: boolean) => string;
  textoContinuar?: string;
  /** Si se indica, tras mostrar el resultado se cierra sola pasados estos milisegundos. */
  autoCerrarMs?: number;
}

/**
 * Muestra una pregunta bíblica fácil con 3 opciones grandes, sin tiempo límite.
 * Equivocarse nunca castiga: se muestra la respuesta correcta con su cita.
 * Resuelve con `true` si acertó.
 */
export function abrirPregunta(opciones: OpcionesPregunta): Promise<boolean> {
  return new Promise((resolver) => {
    const pregunta = preguntaNumero(app.g.indicePregunta, app.biblico());
    app.g.indicePregunta++;
    app.guardar();
    const mostradas = opcionesBarajadas(pregunta, String(app.g.indicePregunta));
    let acerto = false;
    let respondida = false;
    let respondidaEn = 0;
    audio.atenuar(true);

    const lista = h('div', { class: 'opciones-pregunta', role: 'group', 'aria-label': 'Opciones de respuesta' });
    const zonaResultado = h('div', { class: 'pila', 'aria-live': 'polite' });
    const leer = () =>
      voz.hablar(`${pregunta.pregunta.replace('___', 'espacio en blanco')}. Opciones: ${mostradas.map((o, i) => `${i + 1}, ${o.texto}`).join('. ')}.`);

    const botones = mostradas.map((op, i) =>
      boton(op.texto, () => {
        if (respondida) return;
        respondida = true;
        acerto = op.correcta;
        botones.forEach((b, k) => {
          b.disabled = true;
          if (mostradas[k].correcta) b.classList.add('correcta');
        });
        if (!op.correcta) botones[i].classList.add('elegida-mal');
        audio.efecto(op.correcta ? 'acierto' : 'error');
        const correcta = mostradas.find((o) => o.correcta)!.texto;
        const cita = pregunta.ref ? ` (${pregunta.ref})` : '';
        // Protección contra toques dobles: un momento después de responder,
        // ni «Continuar» ni tocar afuera cierran (con letra grande el botón
        // aparece donde estaba la opción y un segundo toque lo activaba).
        respondidaEn = performance.now();
        const continuar = boton(opciones.textoContinuar ?? 'Continuar', () => {
          if (performance.now() - respondidaEn > ESPERA_TOQUE_MS) modal.cerrar();
        }, { variante: 'primario', clase: 'btn-ancho' });
        continuar.disabled = true;
        setTimeout(() => {
          continuar.disabled = false;
          continuar.focus();
        }, ESPERA_TOQUE_MS);
        const mensaje = op.correcta ? '¡Correcto! 🎉' : `Era «${correcta}»${cita}`;
        agregar(zonaResultado, [
          h(
            'p',
            { class: `respuesta ${op.correcta ? 'bien' : 'mal'}` },
            h('span', { text: mensaje }),
            h('strong', { class: 'respuesta-premio', text: opciones.resultado(op.correcta) }),
          ),
          continuar,
          opciones.autoCerrarMs ? h('div', { class: 'cuenta-atras', 'aria-hidden': 'true', style: { animationDuration: `${opciones.autoCerrarMs}ms` } }) : null,
        ]);
        if (app.vozActiva()) voz.hablar(mensaje);
        if (opciones.autoCerrarMs) setTimeout(() => modal.cerrar(), opciones.autoCerrarMs);
      }, { clase: 'opcion' }),
    );
    lista.append(...botones);

    const contenido = h(
      'div',
      { class: 'pila pregunta-cuerpo' },
      h('p', { class: 'pregunta-texto', text: pregunta.pregunta }),
      app.vozActiva() ? boton('Escuchar', leer, { icono: '🔊', variante: 'suave' }) : null,
      lista,
      zonaResultado,
    );

    const modal = abrirModal({
      titulo: opciones.titulo,
      contenido,
      cerrable: false,
      clase: 'modal-pregunta',
      descripcion: opciones.premio,
      alCerrar: () => {
        voz.detener();
        audio.atenuar(false);
        resolver(acerto);
      },
    });
    modal.el.addEventListener('click', (ev) => {
      if (ev.target === modal.el && respondida && performance.now() - respondidaEn > ESPERA_TOQUE_MS) modal.cerrar();
    });
    if (app.vozActiva()) setTimeout(leer, 350);
  });
}
