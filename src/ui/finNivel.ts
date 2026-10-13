import { app } from '../app';
import { audio } from '../audio';
import { LIBROS, NIVELES_POR_LIBRO, ubicarNivel } from '../content/books';
import { claveDia, versiculoDeNivel } from '../content/verses';
import { type ParamsNivel } from '../core/difficulty';
import { PREMIOS, premioNivel, sumarTalentos, tocaQuiz } from '../economy/wallet';
import { efectos } from '../fx/loop';
import { abrirModal, boton, esperar, h } from './dom';
import { abrirPregunta } from './pregunta';

/**
 * Pantalla de nivel completado, compartida por todos los tipos de nivel:
 * guarda el progreso, celebra, muestra estrellas y monedas, y en los niveles
 * con quiz lanza la pregunta sola antes de seguir.
 */
export async function celebrarNivel(opciones: {
  n: number;
  estrellas: number;
  p: ParamsNivel;
  /** Monedas ganadas durante el nivel (por ejemplo, fichas doradas). */
  extra?: number;
  alGuardar?: () => void;
}): Promise<void> {
  const { n, estrellas, p } = opciones;
  const g = app.g;
  const ub = ubicarNivel(n);
  const premio = premioNivel(p, estrellas) + (opciones.extra ?? 0);
  const nuevo = n === g.nivelActual;
  g.estrellas[n] = Math.max(g.estrellas[n] ?? 0, estrellas);
  if (nuevo) g.nivelActual = n + 1;
  sumarTalentos(g, premioNivel(p, estrellas));
  // El versículo del nivel se guarda en «Mis versículos» (no se muestra aquí para que la pantalla sea corta).
  if (g.config.contenidoBiblico && !g.versiculos.some((v) => v.nivel === n)) g.versiculos.unshift({ id: versiculoDeNivel(n).id, nivel: n, fecha: claveDia() });
  delete g.fallos[n];
  app.guardar();
  opciones.alGuardar?.();

  audio.efecto('victoria');
  audio.atenuar(true);
  efectos.celebracion();
  if (!g.config.animacionesReducidas) await esperar(700);

  let finLibro: string | null = null;
  if (nuevo && ub.nivelEnLibro === NIVELES_POR_LIBRO) {
    finLibro = !app.biblico()
      ? `🎉 ¡Completaste la etapa ${ub.libro + 1}!`
      : ub.libro === LIBROS.length - 1
        ? `🎉 ¡Recorriste toda la Biblia! Empieza la vuelta ${ub.vuelta + 1} con fichas nuevas.`
        : `🎉 ¡Terminaste ${ub.nombreLibro}! Sigue ${LIBROS[ub.libro + 1]}.`;
  }

  const quiz = nuevo && tocaQuiz(n);
  const textoPremio = h(
    'p',
    { class: 'premio-monedas' },
    h('span', { class: 'moneda', 'aria-hidden': 'true', text: '🪙' }),
    h('strong', { text: `+${premio}` }),
    h('span', { text: ' monedas' }),
    p.tipoNivel === 'reto' ? h('span', { class: 'doble', text: '×2' }) : null,
  );
  let saliendo = false;
  const salir = async (destino: 'siguiente' | 'inicio') => {
    if (saliendo) return;
    saliendo = true;
    window.clearTimeout(quizAutomatico);
    modal.cerrar();
    if (quiz) {
      // Quiz automático (sin preguntar): pregunta fácil, muestra el resultado y sigue solo.
      const acerto = await abrirPregunta({
        titulo: app.biblico() ? '🧠 Quiz bíblico' : '🧠 Quiz de animalitos',
        premio: `¡Pregunta fácil, ${app.nombre()}! Gana hasta ${PREMIOS.quiz.acierto} monedas.`,
        resultado: (ok) => `+${ok ? PREMIOS.quiz.acierto : PREMIOS.quiz.error} monedas 🪙`,
        textoContinuar: destino === 'siguiente' ? 'Seguir al próximo nivel' : 'Volver al inicio',
        autoCerrarMs: 3500,
      });
      sumarTalentos(app.g, acerto ? PREMIOS.quiz.acierto : PREMIOS.quiz.error);
      app.guardar();
    }
    if (destino === 'siguiente') app.ir('juego', { nivel: n + 1 });
    else app.ir('inicio');
  };
  const siguiente = boton('Siguiente nivel', () => void salir('siguiente'), { icono: '▶', variante: 'primario' });
  siguiente.dataset.focoInicial = '';
  const contenido = h(
    'div',
    { class: 'pila victoria' },
    h(
      'p',
      { class: 'estrellas', 'aria-label': `${estrellas} de 3 estrellas` },
      ...[1, 2, 3].map((i) => h('span', { class: i <= estrellas ? '' : 'apagada', 'aria-hidden': 'true', text: '⭐' })),
    ),
    h('p', { class: 'texto-grande centrado', text: `¡Bien hecho, ${app.nombre()}!` }),
    textoPremio,
    finLibro ? h('p', { class: 'respuesta bien centrado', text: finLibro }) : null,
    h('div', { class: 'fila-botones' }, siguiente, boton('Inicio', () => void salir('inicio'), { icono: '🏠' })),
  );
  // En los niveles con quiz, la pregunta aparece sola tras un momento.
  const quizAutomatico = quiz ? window.setTimeout(() => void salir('siguiente'), 2200) : undefined;
  const modal = abrirModal({
    titulo: `¡Nivel ${n} completado!`,
    contenido,
    cerrable: false,
    clase: 'modal-victoria',
    alCerrar: () => audio.atenuar(false),
  });
}
