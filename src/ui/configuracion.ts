import { app, type Pantalla } from '../app';
import { audio } from '../audio';
import { MODOS, type Dificultad } from '../core/difficulty';
import { MELODIAS } from '../content/melodias';
import { configPorDefecto, type Configuracion } from '../settings/settings';
import { voz } from '../speech';
import { exportarCodigo, guardadoNuevo, importarCodigo, limpiarNombre } from '../storage';
import { avisar, boton, confirmar, copiarTexto, h } from './dom';

type Clave = keyof Configuracion;

function cambiar<K extends Clave>(clave: K, valor: Configuracion[K]): void {
  app.g.config[clave] = valor;
  app.guardar();
  app.aplicarConfig();
}

function opcion(etiqueta: string, control: HTMLElement, ayuda?: string): HTMLElement {
  return h(
    'div',
    { class: 'opcion-config' },
    h('span', { class: 'etiqueta', text: etiqueta }),
    control,
    ayuda ? h('p', { class: 'ayuda-texto', text: ayuda }) : null,
  );
}

/** Grupo de botones grandes donde solo uno está elegido. */
function segmentado<K extends Clave>(clave: K, valores: Array<[Configuracion[K], string]>, etiqueta: string): HTMLElement {
  const grupo = h('div', { class: 'segmentado', role: 'group', 'aria-label': etiqueta });
  const pintar = () =>
    grupo.querySelectorAll<HTMLButtonElement>('button').forEach((b, i) => b.setAttribute('aria-pressed', String(app.g.config[clave] === valores[i][0])));
  for (const [valor, texto] of valores) {
    grupo.append(
      boton(texto, () => {
        cambiar(clave, valor);
        audio.efecto('boton');
        pintar();
      }, { variante: 'secundario' }),
    );
  }
  pintar();
  return grupo;
}

type ClaveSiNo = { [K in Clave]: Configuracion[K] extends boolean ? K : never }[Clave];

function siNo(clave: ClaveSiNo, etiqueta: string): HTMLElement {
  return segmentado<ClaveSiNo>(clave, [[true, 'Sí'], [false, 'No']], etiqueta);
}

function deslizador(clave: 'volumenGeneral' | 'volumenMusica' | 'volumenEfectos', etiqueta: string): HTMLElement {
  const salida = h('output', { text: `${app.g.config[clave]} %` });
  const entrada = h('input', {
    type: 'range',
    min: '0',
    max: '100',
    step: '5',
    value: String(app.g.config[clave]),
    'aria-label': etiqueta,
    oninput: (ev: Event) => {
      const v = Number((ev.target as HTMLInputElement).value);
      salida.textContent = `${v} %`;
      cambiar(clave, v);
    },
    onchange: () => audio.efecto('toc'),
  });
  return h('div', { class: 'deslizador' }, entrada, salida);
}

function seccion(titulo: string, ...hijos: HTMLElement[]): HTMLElement {
  return h('section', { class: 'tarjeta seccion-config' }, h('h2', { text: titulo }), ...hijos);
}

/** Panel completo de configuración. Se usa como pantalla y dentro de la pausa del juego. */
export function panelConfiguracion(opciones: { enJuego?: boolean } = {}): HTMLElement {
  const g = app.g;
  const raiz = h('div', { class: 'pila' });

  /* Jugador */
  const entradaNombre = h('input', { id: 'cfg-nombre', type: 'text', maxlength: '20', value: g.nombre ?? '' }) as HTMLInputElement;
  const errorNombre = h('p', { class: 'error-campo', 'aria-live': 'polite' });
  raiz.append(
    seccion(
      '🙂 Jugador',
      h(
        'div',
        { class: 'campo' },
        h('label', { for: 'cfg-nombre', text: 'Tu nombre' }),
        entradaNombre,
        errorNombre,
        boton('Guardar nombre', () => {
          const nombre = limpiarNombre(entradaNombre.value);
          if (!nombre) {
            errorNombre.textContent = 'Escribe tu nombre con letras (hasta 20).';
            return;
          }
          errorNombre.textContent = '';
          app.g.nombre = nombre;
          app.g.invitado = false;
          app.guardar();
          avisar(`¡Listo, ${nombre}!`);
        }, { variante: 'primario', icono: '💾' }),
      ),
    ),
  );

  /* Dificultad */
  raiz.append(
    seccion(
      '🎯 Dificultad',
      opcion(
        'Nivel de dificultad',
        segmentado('dificultad', (Object.keys(MODOS) as Dificultad[]).map((d) => [d, MODOS[d].nombre]), 'Nivel de dificultad'),
        opciones.enJuego
          ? 'El cambio se aplica al empezar el próximo nivel.'
          : '«Muy fácil» y «Fácil» tienen 8 espacios en la bandeja y más ayudas gratis.',
      ),
      opcion('Ayuda automática (ilumina un trío tras 15 segundos sin jugar)', siNo('ayudaAutomatica', 'Ayuda automática')),
      opcion('Aviso de bandeja casi llena', siNo('avisoBandeja', 'Aviso de bandeja casi llena')),
    ),
  );

  /* Gráficos */
  raiz.append(
    seccion(
      '🖥️ Gráficos',
      opcion(
        'Calidad',
        segmentado('calidad', [['baja', 'Baja'], ['media', 'Media'], ['alta', 'Alta'], ['auto', 'Automática']], 'Calidad'),
        'Baja: sin sombras ni partículas, ideal para computadoras antiguas. Automática: mide el rendimiento y elige.',
      ),
      opcion(
        'Cuadros por segundo (FPS)',
        segmentado('fps', [[30, '30 (ahorro)'], [60, '60'], [0, 'Máximo']], 'Cuadros por segundo'),
      ),
      opcion('Animaciones', segmentado('animacionesReducidas', [[false, 'Completas'], [true, 'Reducidas']], 'Animaciones')),
      opcion('Mostrar FPS en pantalla', siNo('mostrarFps', 'Mostrar FPS')),
    ),
  );

  /* Sonido */
  const selectorMelodia = h('div', { class: 'segmentado', role: 'group', 'aria-label': 'Melodía' });
  const pintarMelodias = () => {
    selectorMelodia.replaceChildren(
      ...MELODIAS.filter((m) => app.g.compras.includes(m.id)).map((m) => {
        const b = boton(m.nombre, () => {
          cambiar('melodia', m.id);
          pintarMelodias();
        }, { variante: 'secundario' });
        b.setAttribute('aria-pressed', String(app.g.config.melodia === m.id));
        return b;
      }),
    );
  };
  pintarMelodias();
  const velocidadVoz = segmentado('velocidadVoz', [[0.75, 'Lenta'], [0.9, 'Normal'], [1.05, 'Rápida']], 'Velocidad de la voz');
  raiz.append(
    seccion(
      '🔊 Sonido',
      opcion('Volumen general', deslizador('volumenGeneral', 'Volumen general')),
      opcion('Música', deslizador('volumenMusica', 'Volumen de la música')),
      opcion('Efectos', deslizador('volumenEfectos', 'Volumen de los efectos')),
      opcion('Melodía', selectorMelodia, 'Puedes canjear más himnos en El Alfolí.'),
      opcion(
        'Lectura en voz alta',
        siNo('vozActiva', 'Lectura en voz alta'),
        voz.disponible ? 'Lee los mensajes, las preguntas y los versículos.' : 'Este navegador no tiene una voz en español disponible.',
      ),
      opcion('Velocidad de la voz', velocidadVoz),
      boton('Probar la voz', () => voz.hablar(`Hola, ${app.nombre()}. Así suena la lectura en voz alta.`), {
        icono: '🗣️',
        variante: 'suave',
        deshabilitado: !voz.disponible,
      }),
    ),
  );

  /* Pantalla */
  const botonPantallaCompleta = boton(
    document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa',
    async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        avisar('Este navegador no permite pantalla completa.');
      }
      botonPantallaCompleta.querySelector('.btn-texto')!.textContent = document.fullscreenElement
        ? 'Salir de pantalla completa'
        : 'Pantalla completa';
    },
    { icono: '⛶', variante: 'suave' },
  );
  raiz.append(
    seccion(
      '👓 Pantalla',
      opcion('Tamaño del texto', segmentado('tamanoTexto', [['normal', 'Normal'], ['grande', 'Grande'], ['muyGrande', 'Muy grande']], 'Tamaño del texto')),
      opcion('Alto contraste', siNo('altoContraste', 'Alto contraste')),
      opcion('Tema', segmentado('tema', [['claro', 'Claro'], ['oscuro', 'Oscuro'], ['auto', 'Automático']], 'Tema')),
      opcion('Cursor grande', siNo('cursorGrande', 'Cursor grande')),
      opcion('Pantalla completa', botonPantallaCompleta, 'También puedes acercar con Ctrl y + en el teclado.'),
    ),
  );

  /* Datos */
  if (!opciones.enJuego) {
    const codigo = h('textarea', { id: 'cfg-exportar', readonly: true, rows: '3' }) as HTMLTextAreaElement;
    codigo.value = exportarCodigo(g);
    const importar = h('textarea', { id: 'cfg-importar', rows: '3', placeholder: 'Pega aquí el código MCL1-…' }) as HTMLTextAreaElement;
    raiz.append(
      seccion(
        '💾 Mis datos',
        h('p', { class: 'texto-suave', text: 'Tu progreso se guarda solo en este navegador. Para seguir en otra computadora, copia este código y pégalo allá.' }),
        h('div', { class: 'campo' }, h('label', { for: 'cfg-exportar', text: 'Código de mi progreso' }), codigo),
        boton('Copiar código', async () => {
          codigo.value = exportarCodigo(app.g);
          if (await copiarTexto(codigo.value)) avisar('Código copiado');
        }, { icono: '📋', variante: 'suave' }),
        h('div', { class: 'campo' }, h('label', { for: 'cfg-importar', text: 'Cargar progreso desde un código' }), importar),
        boton('Cargar progreso', async () => {
          const datos = importarCodigo(importar.value);
          if (!datos) {
            avisar('Ese código no es válido. Revisa que esté completo.');
            return;
          }
          if (await confirmar('Cargar progreso', 'Se reemplazará el progreso de este navegador. ¿Continuar?', 'Sí, cargar')) {
            app.g = datos;
            app.guardar();
            app.aplicarConfig();
            avisar('Progreso cargado');
            app.ir('inicio');
          }
        }, { icono: '📥', variante: 'secundario' }),
        boton('Restaurar valores recomendados', () => {
          app.g.config = { ...configPorDefecto(), melodia: app.g.config.melodia };
          app.guardar();
          app.aplicarConfig();
          avisar('Configuración restaurada');
          app.ir('configuracion');
        }, { icono: '↺', variante: 'suave' }),
        boton('Reiniciar todo el progreso', async () => {
          const ok = await confirmar(
            'Reiniciar progreso',
            'Se borrarán tus niveles, talentos, versículos y compras. Esta acción no se puede deshacer. ¿Seguro?',
            'Sí, borrar todo',
          );
          if (!ok) return;
          app.g = guardadoNuevo();
          app.guardar();
          app.aplicarConfig();
          app.ir('bienvenida');
        }, { icono: '🗑️', variante: 'peligro' }),
      ),
    );
  }
  return raiz;
}

export function pantallaConfiguracion(): Pantalla {
  const el = h(
    'main',
    { class: 'pantalla pila' },
    h('header', { class: 'cabecera' }, boton('Volver', () => app.ir('inicio'), { icono: '←' }), h('h1', { text: '⚙️ Configuración' })),
    panelConfiguracion(),
  );
  return { el };
}
