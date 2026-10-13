import { app, type Pantalla } from '../app';
import { audio } from '../audio';
import { svgFicha } from '../content/tiles';
import { claveDia } from '../content/verses';
import {
  ARTICULOS,
  AYUDAS,
  NOMBRES_CATEGORIA,
  ORDEN_AYUDAS,
  type Articulo,
  type Categoria,
} from '../economy/shop';
import {
  PREMIOS,
  comprarArticulo,
  comprarAyuda,
  ganaTalentosRestantes,
  registrarGanaTalentos,
  sumarTalentos,
} from '../economy/wallet';
import { avisar, boton, confirmar, h } from './dom';
import { chipTalentos } from './componentes';
import { abrirPregunta } from './pregunta';

const COLORES_ESTILO: Record<string, [string, string]> = {
  marfil: ['#fffaf0', '#b39a6d'],
  acacia: ['#f3dcb8', '#6e451f'],
  lino: ['#eef6ff', '#6f8fb5'],
  oro: ['#fffbea', '#b8860b'],
};

const MUESTRA_FONDO: Record<string, string> = {
  amanecer: 'linear-gradient(180deg, #fdf4e3, #f5d6ae)',
  galilea: 'linear-gradient(180deg, #eaf6fd, #78b8de)',
  olivos: 'linear-gradient(180deg, #f2f8ea, #87b36b)',
  trigal: 'linear-gradient(180deg, #fff8e3, #e3b551)',
  templo: 'linear-gradient(180deg, #f6f0e4, #e2d6c0)',
  atardecer: 'linear-gradient(180deg, #ffe3bd, #f9b9a0, #c9a3dc)',
};

const MUESTRA_TARJETA: Record<string, string> = {
  sencilla: '#fffaf0',
  pergamino: 'radial-gradient(#f8ecd0, #d9b98a)',
  olivo: '#f4f9ee',
  cielo: 'linear-gradient(180deg, #0f2547, #2c4f86)',
};

/** Tienda "El Alfolí" (Malaquías 3:10): se canjean monedas por ayudas y adornos. */
export function pantallaAlfoli(params: Record<string, unknown>): Pantalla {
  const categoria = (typeof params.categoria === 'string' ? params.categoria : 'ayuda') as Categoria;
  const talentos = chipTalentos();
  const recargar = () => app.ir('alfoli', { categoria });

  const pestanas = h(
    'div',
    { class: 'pestanas', role: 'group', 'aria-label': 'Categorías' },
    ...(Object.keys(NOMBRES_CATEGORIA) as Categoria[]).filter((c) => app.biblico() || c !== 'tarjeta').map((c) => {
      const b = boton(NOMBRES_CATEGORIA[c], () => app.ir('alfoli', { categoria: c }), { variante: 'secundario' });
      b.setAttribute('aria-pressed', String(c === categoria));
      return b;
    }),
  );

  const hoy = claveDia();
  const restantes = ganaTalentosRestantes(app.g, hoy);
  const ganar = boton(
    restantes > 0 ? `Gana monedas con una pregunta (quedan ${restantes} hoy)` : 'Ya respondiste las preguntas de hoy',
    async () => {
      const acerto = await abrirPregunta({
        titulo: '🙋 Gana monedas',
        premio: `Responde y gana ${PREMIOS.ganaTalentos.acierto} monedas.`,
        resultado: (ok) => `+${ok ? PREMIOS.ganaTalentos.acierto : PREMIOS.ganaTalentos.error} monedas 🪙`,
      });
      sumarTalentos(app.g, acerto ? PREMIOS.ganaTalentos.acierto : PREMIOS.ganaTalentos.error);
      registrarGanaTalentos(app.g, hoy);
      app.guardar();
      recargar();
    },
    { icono: '❓', variante: 'primario', deshabilitado: restantes === 0 },
  );

  const lista = h('div', { class: 'articulos' });
  if (categoria === 'ayuda') {
    for (const id of ORDEN_AYUDAS) {
      const info = AYUDAS[id];
      lista.append(
        h(
          'article',
          { class: 'tarjeta articulo' },
          h('div', { class: 'centrado', style: { fontSize: '2.6rem' }, 'aria-hidden': 'true', text: info.icono }),
          h('h3', { text: info.nombre }),
          h('p', { text: info.descripcion }),
          h('p', { class: 'texto-suave', text: app.biblico() ? `Basado en ${info.ref} · Tienes: ${app.g.ayudas[id]}` : `Tienes: ${app.g.ayudas[id]}` }),
          boton(`Canjear por ${info.precio} 🪙`, () => {
            const r = comprarAyuda(app.g, id);
            if (r === 'ok') {
              app.guardar();
              audio.efecto('canje');
              avisar(`¡Listo! Ahora tienes ${app.g.ayudas[id]} «${info.nombre}».`);
              recargar();
            } else avisar('No tienes suficientes monedas todavía.');
          }, { variante: 'primario', deshabilitado: app.g.talentos < info.precio }),
        ),
      );
    }
  } else {
    for (const art of ARTICULOS.filter((a) => a.categoria === categoria)) lista.append(tarjetaArticulo(art, recargar));
  }

  const el = h(
    'main',
    { class: 'pantalla pila' },
    h(
      'header',
      { class: 'cabecera' },
      boton('Volver', () => app.ir('inicio'), { icono: '←' }),
      h('h1', { text: app.biblico() ? '🧺 El Alfolí' : '🧺 Tienda' }),
      talentos.el,
    ),
    h('p', { class: 'texto-suave', text: 'Canjea las monedas que ganas jugando y respondiendo preguntas. Todo es gratis: no se usa dinero real.' }),
    ganar,
    pestanas,
    lista,
  );
  return { el };
}

function muestra(art: Articulo): HTMLElement {
  if (art.categoria === 'estilo') {
    const [cara, borde] = COLORES_ESTILO[art.id];
    return h('div', {
      class: 'muestra-ficha',
      style: { background: cara, borderColor: borde },
      html: svgFicha('paloma'),
      'aria-hidden': 'true',
    });
  }
  if (art.categoria === 'fondo') return h('div', { class: 'muestra', style: { background: MUESTRA_FONDO[art.id] }, 'aria-hidden': 'true' });
  if (art.categoria === 'tarjeta') return h('div', { class: 'muestra', style: { background: MUESTRA_TARJETA[art.id] }, 'aria-hidden': 'true' });
  return h('div', { class: 'centrado', style: { fontSize: '2.6rem' }, 'aria-hidden': 'true', text: '🎵' });
}

function estaEquipado(art: Articulo): boolean {
  const g = app.g;
  if (art.categoria === 'melodia') return g.config.melodia === art.id;
  return g.equipado[art.categoria] === art.id;
}

function equipar(art: Articulo): void {
  if (art.categoria === 'melodia') app.g.config.melodia = art.id;
  else app.g.equipado[art.categoria] = art.id;
  app.guardar();
  app.aplicarConfig();
}

function tarjetaArticulo(art: Articulo, recargar: () => void): HTMLElement {
  const comprado = app.g.compras.includes(art.id);
  const acciones = h('div', { class: 'fila-botones' });
  if (!comprado) {
    acciones.append(
      boton(`Canjear por ${art.precio} 🪙`, async () => {
        const ok = await confirmar(art.nombre, `¿Canjear ${art.precio} monedas por «${art.nombre}»?`, `Sí, canjear`);
        if (!ok) return;
        const r = comprarArticulo(app.g, art.id);
        if (r === 'ok') {
          equipar(art);
          audio.efecto('canje');
          avisar(`¡«${art.nombre}» es tuyo y ya está en uso!`);
          recargar();
        } else avisar('No tienes suficientes monedas todavía.');
      }, { variante: 'primario', deshabilitado: app.g.talentos < art.precio }),
    );
  } else if (estaEquipado(art)) {
    acciones.append(boton('En uso ✔', () => undefined, { variante: 'suave', deshabilitado: true }));
  } else {
    acciones.append(
      boton('Usar', () => {
        equipar(art);
        audio.efecto('boton');
        avisar(`Ahora usas «${art.nombre}».`);
        recargar();
      }, { variante: 'secundario' }),
    );
  }
  if (art.categoria === 'melodia' && comprado && !app.g.config.volumenMusica) {
    acciones.append(h('p', { class: 'texto-suave', text: 'La música está en silencio en Configuración.' }));
  }
  return h(
    'article',
    { class: 'tarjeta articulo' },
    muestra(art),
    h('h3', { text: art.nombre }),
    h('p', { text: art.descripcion }),
    acciones,
  );
}
