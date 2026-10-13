import { app } from '../app';
import { audio } from '../audio';
import { CREDITO_RVR1960, textoVisible, type Versiculo } from '../content/verses';
import { abrirLectura } from './biblia';
import { svgFicha } from '../content/tiles';
import { voz } from '../speech';
import { avisar, boton, copiarTexto, h } from './dom';
import { descargarTarjeta } from './tarjeta';

export function logo(): HTMLElement {
  const el = h('span', { class: 'logo' });
  el.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="6" width="52" height="56" rx="10" fill="#d6c29b"/><rect x="6" y="2" width="52" height="56" rx="10" fill="#fffaf0" stroke="#b39a6d" stroke-width="3"/><path d="M28 12 H36 V24 H47 V32 H36 V50 H28 V32 H17 V24 H28 Z" fill="#a8693a" stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  el.append(h('span', { text: 'McL Tiles' }));
  return el;
}

export function miniFicha(tipo: string, clase = 'mini-ficha'): HTMLElement {
  return h('span', { class: `ficha-bandeja ${clase}`, style: { position: 'relative', display: 'inline-block', aspectRatio: '1 / 1.15' }, html: svgFicha(tipo) });
}

/** Chip con los talentos; devuelve el elemento y una función para refrescarlo. */
export function chipTalentos(): { el: HTMLElement; refrescar: () => void } {
  const el = h('span', { class: 'chip', 'aria-live': 'polite' });
  const refrescar = () => {
    el.textContent = `🪙 ${app.g.talentos} talentos`;
  };
  refrescar();
  return { el, refrescar };
}

/** Botón 🔊 para escuchar un texto. Si no hay voz en español disponible, no se muestra. */
export function botonEscuchar(texto: () => string, etiqueta = 'Escuchar'): HTMLElement | null {
  if (!app.vozActiva()) return null;
  return boton(etiqueta, () => voz.hablar(texto()), { icono: '🔊', variante: 'suave' });
}

export function textoCompartir(v: Versiculo): string {
  return `«${textoVisible(v)}» — ${v.ref} (RVR1960)`;
}

export async function compartirVersiculo(v: Versiculo): Promise<void> {
  const texto = `${textoCompartir(v)}\n\nCompartido desde McL Tiles.`;
  if (navigator.share) {
    try {
      await navigator.share({ title: v.ref, text: texto });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
    }
  }
  if (await copiarTexto(texto)) avisar('Versículo copiado. Ya puedes pegarlo para compartirlo.');
}

/** Tarjeta de versículo con sus acciones: escuchar, copiar, compartir, imagen, leer capítulo y favorito. */
export function tarjetaVersiculo(
  v: Versiculo,
  opciones: { titulo?: string; favorito?: boolean; detalle?: string; credito?: boolean } = {},
): HTMLElement {
  const acciones = h('div', { class: 'acciones-versiculo' });
  const escuchar = botonEscuchar(() => `${textoVisible(v)}. ${v.ref.replace(':', ', versículo ')}.`);
  if (escuchar) acciones.append(escuchar);
  acciones.append(
    boton('Copiar', async () => {
      if (await copiarTexto(textoCompartir(v))) {
        audio.efecto('boton');
        avisar('Versículo copiado');
      }
    }, { icono: '📋', variante: 'suave' }),
    boton('Compartir', () => void compartirVersiculo(v), { icono: '📤', variante: 'suave' }),
    boton('Imagen', () => {
      void descargarTarjeta(v, app.g.equipado.tarjeta, app.nombre());
      avisar('Descargando la tarjeta del versículo…');
    }, { icono: '🖼️', variante: 'suave', etiqueta: 'Descargar el versículo como imagen' }),
    boton('Leer en la Biblia', () => abrirLectura(v), { icono: '📖', variante: 'suave' }),
  );
  if (opciones.favorito !== undefined) {
    const esFavorito = () => app.g.favoritos.includes(v.id);
    const fav = boton('', () => {
      if (esFavorito()) app.g.favoritos = app.g.favoritos.filter((f) => f !== v.id);
      else app.g.favoritos.push(v.id);
      app.guardar();
      pintar();
      avisar(esFavorito() ? 'Guardado en favoritos ⭐' : 'Quitado de favoritos');
    }, { variante: 'suave' });
    const pintar = () => {
      fav.querySelector('.btn-texto')!.textContent = esFavorito() ? '★ Favorito' : '☆ Favorito';
      fav.setAttribute('aria-pressed', String(esFavorito()));
    };
    pintar();
    acciones.append(fav);
  }
  return h(
    'article',
    { class: 'tarjeta versiculo' },
    opciones.titulo ? h('h2', { text: opciones.titulo }) : null,
    h('blockquote', { text: `«${textoVisible(v)}»` }),
    h('cite', { text: `${v.ref} (RVR1960)` }),
    opciones.detalle ? h('p', { class: 'texto-suave', text: opciones.detalle }) : null,
    acciones,
    opciones.credito !== false ? h('p', { class: 'credito', text: CREDITO_RVR1960 }) : null,
  );
}

/** Mensaje grande de ánimo en el centro de la pantalla. */
export function mostrarAnimo(texto: string): void {
  const el = h('div', { class: 'animo', 'aria-hidden': 'true', text: texto });
  document.body.append(el);
  setTimeout(() => el.remove(), 1500);
}
