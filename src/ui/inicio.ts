import { app, type Pantalla } from '../app';
import { claveDia, textoVisible, versiculoDelDia } from '../content/verses';
import { PREMIOS, puedePreguntaDelDia, registrarPreguntaDelDia, sumarTalentos } from '../economy/wallet';
import { voz } from '../speech';
import { avisar, h } from './dom';
import { chipTalentos, logo } from './componentes';
import { abrirPregunta } from './pregunta';

function saludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Botón redondo con ícono grande y nombre corto (mismo estilo que las ayudas del juego). */
function atajo(icono: string, texto: string, alHacerClic: () => void, insignia?: { texto: string; ok?: boolean }): HTMLElement {
  return h(
    'button',
    { type: 'button', class: 'atajo', onclick: alHacerClic, 'aria-label': insignia ? `${texto} (${insignia.texto})` : texto },
    h('span', { class: 'icono', 'aria-hidden': 'true', text: icono }),
    h('span', { class: 'atajo-texto', text: texto }),
    insignia ? h('span', { class: `insignia ${insignia.ok ? 'ok' : ''}`, 'aria-hidden': 'true', text: insignia.texto }) : null,
  );
}

/** Inicio simple: saludo, un botón grande para jugar y pocos atajos. */
export function pantallaInicio(): Pantalla {
  const g = app.g;
  const n = g.nivelActual;
  const talentos = chipTalentos();
  const hoy = claveDia();
  const disponible = puedePreguntaDelDia(g, hoy);

  const preguntaDelDia = async () => {
    if (!puedePreguntaDelDia(app.g, hoy)) {
      avisar('Ya respondiste la pregunta de hoy. ¡Vuelve mañana!');
      return;
    }
    const ayer = claveDia(new Date(Date.now() - 86400000));
    const acerto = await abrirPregunta({
      titulo: '❓ Pregunta del día',
      premio: `Responde y gana hasta ${PREMIOS.preguntaDia.acierto} monedas.`,
      resultado: (ok) => `+${ok ? PREMIOS.preguntaDia.acierto : PREMIOS.preguntaDia.error} monedas 🪙`,
      autoCerrarMs: 3500,
    });
    sumarTalentos(app.g, acerto ? PREMIOS.preguntaDia.acierto : PREMIOS.preguntaDia.error);
    registrarPreguntaDelDia(app.g, hoy, ayer);
    app.guardar();
    app.ir('inicio');
  };

  const verso = app.biblico() ? versiculoDelDia() : null;
  const enlace = (texto: string, ir: () => void) => h('button', { type: 'button', class: 'enlace', onclick: ir, text: texto });

  const el = h(
    'main',
    { class: 'pantalla inicio-simple' },
    h('header', { class: 'cabecera' }, logo(), talentos.el),
    h('h1', { class: 'centrado', text: `${saludo()}, ${app.nombre()}` }),
    h(
      'button',
      { type: 'button', class: 'btn btn-primario btn-jugar-grande', onclick: () => app.ir('juego', { nivel: n }) },
      h('span', { class: 'jugar-icono', 'aria-hidden': 'true', text: '▶' }),
      h('span', { class: 'btn-texto', text: 'Jugar' }),
      h('small', { text: `Nivel ${n}` }),
    ),
    h(
      'nav',
      { class: 'atajos', 'aria-label': 'Menú principal' },
      atajo('❓', 'Pregunta', () => void preguntaDelDia(), { texto: disponible ? '¡Nueva!' : '✔', ok: !disponible }),
      atajo('🧺', 'Tienda', () => app.ir('alfoli')),
      app.biblico() ? atajo('📖', 'Biblia', () => app.ir('biblia')) : null,
      atajo('⚙️', 'Ajustes', () => app.ir('configuracion')),
    ),
    verso
      ? h(
          'button',
          {
            type: 'button',
            class: 'verso-dia',
            'aria-label': `Versículo del día: ${textoVisible(verso)} ${verso.ref}`,
            onclick: () => (app.vozActiva() ? voz.hablar(`${textoVisible(verso)}. ${verso.ref}`) : app.ir('versiculos')),
          },
          h('span', { class: 'verso-texto', text: `«${textoVisible(verso)}»` }),
          h('span', { class: 'verso-ref', text: verso.ref }),
        )
      : null,
    h(
      'p',
      { class: 'enlaces-inicio' },
      enlace('🗺️ Recorrido', () => app.ir('recorrido')),
      app.biblico() ? enlace('⭐ Mis versículos', () => app.ir('versiculos')) : null,
      enlace('ℹ️ Acerca', () => app.ir('acerca')),
    ),
  );
  return { el };
}
