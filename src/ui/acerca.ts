import { app, type Pantalla } from '../app';
import { CREDITO_RVR1960, VERSICULOS } from '../content/verses';
import { PREGUNTAS } from '../content/quiz';
import { MELODIAS } from '../content/melodias';
import { boton, h } from './dom';

export function pantallaAcerca(): Pantalla {
  const seccion = (titulo: string, ...parrafos: Array<string | HTMLElement>) =>
    h('section', { class: 'tarjeta pila' }, h('h2', { text: titulo }), ...parrafos.map((p) => (typeof p === 'string' ? h('p', { text: p }) : p)));

  const el = h(
    'main',
    { class: 'pantalla pila' },
    h('header', { class: 'cabecera' }, boton('Volver', () => app.ir('inicio'), { icono: '←' }), h('h1', { text: 'ℹ️ Acerca de McL Tiles' })),
    seccion(
      '¿Cómo se juega?',
      '1. Haz clic en una ficha con borde dorado: pasa a la bandeja de abajo.',
      '2. Cuando juntas tres fichas iguales en la bandeja, desaparecen.',
      '3. Vacía el tablero para ganar el nivel y recibir un versículo de la Biblia.',
      '4. Si la bandeja se llena, puedes responder una pregunta bíblica para seguir, usar una ayuda o intentarlo otra vez. No hay prisa ni tiempo límite.',
      'También puedes jugar con el teclado: Tab para moverte entre las fichas libres, Enter para elegir y Esc para pausar.',
    ),
    seccion(
      'Un juego que no termina',
      'Los niveles se crean solos y siempre tienen solución. Cada 20 niveles avanzas un libro de la Biblia, de Génesis a Apocalipsis, y después empieza una nueva vuelta.',
      `Incluye ${VERSICULOS.length} versículos y ${PREGUNTAS.length} preguntas bíblicas que se van turnando.`,
    ),
    seccion('Texto bíblico', CREDITO_RVR1960, 'Los versículos están guardados dentro del juego: se leen sin conexión y sin depender de otras páginas.'),
    seccion(
      'Música',
      `Arreglos instrumentales propios, generados en el navegador, de melodías de dominio público: ${MELODIAS.map((m) => m.nombre).join(', ')}.`,
    ),
    seccion(
      'Privacidad',
      'Tu nombre y tu progreso se guardan solo en este navegador. No se envían a ningún servidor ni se usan para publicidad.',
    ),
    seccion('Íconos', 'Las fichas son ilustraciones propias. Se usa la cruz vacía y símbolos bíblicos, sin imágenes de personas.'),
  );
  return { el };
}
