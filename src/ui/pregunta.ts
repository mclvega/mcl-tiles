import { app } from '../app';
import { audio } from '../audio';
import { opcionesBarajadas, preguntaNumero } from '../content/quiz';
import { voz } from '../speech';
import { abrirModal, agregar, boton, h } from './dom';

export interface OpcionesPregunta {
  titulo: string;
  /** Texto que explica el premio antes de responder. */
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
    const pregunta = preguntaNumero(app.g.indicePregunta);
    app.g.indicePregunta++;
    app.guardar();
    const mostradas = opcionesBarajadas(pregunta, String(app.g.indicePregunta));
    let acerto = false;
    let respondida = false;
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
        const mensaje = op.correcta
          ? `¡Correcto, ${app.nombre()}! 🎉`
          : `La respuesta es «${correcta}»${cita}. ¡Ahora ya lo sabes!`;
        agregar(zonaResultado, [
          h('p', { class: `respuesta ${op.correcta ? 'bien' : 'mal'}`, text: mensaje }),
          h('p', { class: 'premio', text: opciones.resultado(op.correcta) }),
          boton(opciones.textoContinuar ?? 'Continuar', () => modal.cerrar(), { variante: 'primario', clase: 'btn-grande' }),
          opciones.autoCerrarMs ? h('div', { class: 'cuenta-atras', 'aria-hidden': 'true', style: { animationDuration: `${opciones.autoCerrarMs}ms` } }) : null,
        ]);
        if (app.vozActiva()) voz.hablar(mensaje);
        if (opciones.autoCerrarMs) setTimeout(() => modal.cerrar(), opciones.autoCerrarMs);
        zonaResultado.querySelector<HTMLButtonElement>('.btn-primario')?.focus();
      }, { icono: `${i + 1}.`, clase: 'opcion' }),
    );
    lista.append(...botones);

    const contenido = h(
      'div',
      { class: 'pila' },
      h('p', { class: 'texto-suave', text: opciones.premio }),
      h('p', { class: 'pregunta-texto', text: pregunta.pregunta }),
      app.vozActiva() ? boton('Escuchar la pregunta', leer, { icono: '🔊', variante: 'suave' }) : null,
      lista,
      zonaResultado,
    );

    const modal = abrirModal({
      titulo: opciones.titulo,
      contenido,
      cerrable: false,
      clase: 'modal-pregunta',
      alCerrar: () => {
        voz.detener();
        audio.atenuar(false);
        resolver(acerto);
      },
    });
    if (app.vozActiva()) setTimeout(leer, 350);
  });
}
