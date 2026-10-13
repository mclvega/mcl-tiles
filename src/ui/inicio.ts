import { app, type Pantalla } from '../app';
import { ubicarNivel, NIVELES_POR_LIBRO } from '../content/books';
import { claveDia, versiculoDelDia } from '../content/verses';
import { PREMIOS, puedePreguntaDelDia, registrarPreguntaDelDia, sumarTalentos } from '../economy/wallet';
import { avisar, boton, h } from './dom';
import { chipTalentos, logo, tarjetaVersiculo } from './componentes';
import { abrirPregunta } from './pregunta';

function saludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function pantallaInicio(): Pantalla {
  const g = app.g;
  const n = g.nivelActual;
  const ub = ubicarNivel(n);
  const talentos = chipTalentos();
  const hoy = claveDia();

  const botonPregunta = boton('Pregunta del día', async () => {
    if (!puedePreguntaDelDia(app.g, hoy)) {
      avisar('Ya respondiste la pregunta de hoy. ¡Vuelve mañana!');
      return;
    }
    const ayer = claveDia(new Date(Date.now() - 86400000));
    const acerto = await abrirPregunta({
      titulo: '❓ Pregunta del día',
      premio: `Responde y gana hasta ${PREMIOS.preguntaDia.acierto} monedas.`,
      resultado: (ok) => {
        const premio = ok ? PREMIOS.preguntaDia.acierto : PREMIOS.preguntaDia.error;
        return `+${premio} monedas 🪙`;
      },
    });
    sumarTalentos(app.g, acerto ? PREMIOS.preguntaDia.acierto : PREMIOS.preguntaDia.error);
    registrarPreguntaDelDia(app.g, hoy, ayer);
    app.guardar();
    app.ir('inicio');
  }, { icono: '❓', variante: 'secundario' });
  const disponible = puedePreguntaDelDia(g, hoy);
  botonPregunta.append(h('span', { class: `insignia ${disponible ? '' : 'ok'}`, text: disponible ? '¡Nueva!' : 'Hecha ✔' }));
  if (!disponible) botonPregunta.setAttribute('aria-disabled', 'true');

  const el = h(
    'main',
    { class: 'pantalla pila' },
    h('header', { class: 'cabecera' }, logo(), h('div', { class: 'fila-botones' }, talentos.el,
      g.racha.dias > 1 ? h('span', { class: 'chip', text: `🔥 ${g.racha.dias} días seguidos` }) : null)),
    h(
      'section',
      { class: 'tarjeta saludo pila' },
      h('h1', { text: `${saludo()}, ${app.nombre()} 🙏` }),
      h('p', { class: 'texto-grande', text: 'Dios te bendiga. ¿Jugamos un rato juntos?' }),
      h(
        'button',
        { type: 'button', class: 'btn btn-primario btn-grande btn-jugar', onclick: () => app.ir('juego', { nivel: n }) },
        h('span', { class: 'btn-texto', text: `▶ Jugar · Nivel ${n}` }),
        h('small', {
          text: `${ub.nombreLibro} · nivel ${ub.nivelEnLibro} de ${NIVELES_POR_LIBRO}${ub.vuelta > 1 ? ` · Vuelta ${ub.vuelta}` : ''}`,
        }),
      ),
    ),
    tarjetaVersiculo(versiculoDelDia(), { titulo: '📖 Versículo del día' }),
    h(
      'nav',
      { class: 'menu-inicio', 'aria-label': 'Menú principal' },
      botonPregunta,
      boton('El Alfolí (tienda)', () => app.ir('alfoli'), { icono: '🧺' }),
      boton('Biblia', () => app.ir('biblia'), { icono: '📜' }),
      boton('Mis versículos', () => app.ir('versiculos'), { icono: '📖' }),
      boton('Recorrido', () => app.ir('recorrido'), { icono: '🗺️' }),
      boton('Configuración', () => app.ir('configuracion'), { icono: '⚙️' }),
      boton('Acerca del juego', () => app.ir('acerca'), { icono: 'ℹ️' }),
    ),
  );
  return { el };
}
