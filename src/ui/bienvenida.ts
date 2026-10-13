import { app, type Pantalla } from '../app';
import { audio } from '../audio';
import { VERSICULOS_POR_ID, textoVisible } from '../content/verses';
import { limpiarNombre } from '../storage';
import { boton, h } from './dom';
import { logo, miniFicha } from './componentes';

/** Primer inicio: pide el nombre del jugador (o permite jugar como invitado). */
export function pantallaBienvenida(): Pantalla {
  const bendicion = VERSICULOS_POR_ID.get(168)!;
  const entrada = h('input', {
    id: 'nombre',
    type: 'text',
    maxlength: '20',
    autocomplete: 'given-name',
    'aria-describedby': 'nombre-ayuda nombre-error',
    'data-foco-inicial': true,
  }) as HTMLInputElement;
  const error = h('p', { id: 'nombre-error', class: 'error-campo', 'aria-live': 'polite' });

  const comenzar = (nombre: string | null, invitado: boolean) => {
    app.g.nombre = nombre;
    app.g.invitado = invitado;
    app.guardar();
    audio.efecto('acierto');
    app.ir('inicio');
  };

  const enviar = (ev: Event) => {
    ev.preventDefault();
    const nombre = limpiarNombre(entrada.value);
    if (!nombre) {
      error.textContent = 'Escribe tu nombre con letras (hasta 20).';
      entrada.focus();
      return;
    }
    comenzar(nombre, false);
  };

  const formulario = h(
    'form',
    { class: 'pila', onsubmit: enviar, novalidate: true },
    h(
      'div',
      { class: 'campo' },
      h('label', { for: 'nombre', text: '¿Cómo te llamas?' }),
      entrada,
      h('p', { id: 'nombre-ayuda', class: 'texto-suave', text: 'Usaremos tu nombre para saludarte. Solo se guarda en este navegador.' }),
      error,
    ),
    h(
      'button',
      { type: 'submit', class: 'btn btn-primario btn-grande' },
      h('span', { class: 'btn-icono', 'aria-hidden': 'true', text: '▶' }),
      h('span', { class: 'btn-texto', text: 'Comenzar' }),
    ),
    boton('Jugar como invitado', () => comenzar(null, true), { variante: 'secundario', clase: 'btn-ancho' }),
  );

  const el = h(
    'main',
    { class: 'pantalla bienvenida' },
    h(
      'div',
      { class: 'tarjeta pila' },
      h('div', { class: 'bienvenida-fichas', 'aria-hidden': 'true' }, miniFicha('cordero'), miniFicha('arpa'), miniFicha('paloma')),
      h('h1', { text: '¡Bienvenido a McL Tiles!' }),
      h('div', { class: 'centrado' }, logo()),
      h('p', { class: 'texto-grande' }, 'Junta tres fichas iguales y recibe un versículo de la Biblia en cada nivel.'),
      h('blockquote', { class: 'texto-suave', text: `«${textoVisible(bendicion)}» — ${bendicion.ref}` }),
      formulario,
    ),
  );
  return { el };
}
