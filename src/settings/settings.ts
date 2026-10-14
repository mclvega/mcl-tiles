import { MODOS, type Dificultad } from '../core/difficulty';

export type Calidad = 'baja' | 'media' | 'alta' | 'auto';
export type LimiteFps = 30 | 60 | 0;
export type TamanoTexto = 'normal' | 'grande' | 'muyGrande';
export type Tema = 'claro' | 'oscuro' | 'auto';

export interface Configuracion {
  /** Versículos, Biblia y preguntas bíblicas. Si es false, el juego usa solo la temática de animalitos. */
  contenidoBiblico: boolean;
  dificultad: Dificultad;
  ayudaAutomatica: boolean;
  avisoBandeja: boolean;
  calidad: Calidad;
  /** 0 = máximo del dispositivo. */
  fps: LimiteFps;
  animacionesReducidas: boolean;
  mostrarFps: boolean;
  volumenGeneral: number;
  volumenMusica: number;
  volumenEfectos: number;
  melodia: string;
  vozActiva: boolean;
  velocidadVoz: number;
  tamanoTexto: TamanoTexto;
  altoContraste: boolean;
  tema: Tema;
  cursorGrande: boolean;
}

function prefiereMenosMovimiento(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function configPorDefecto(): Configuracion {
  return {
    contenidoBiblico: true,
    dificultad: 'facil',
    ayudaAutomatica: true,
    avisoBandeja: true,
    calidad: 'auto',
    fps: 60,
    animacionesReducidas: prefiereMenosMovimiento(),
    mostrarFps: false,
    volumenGeneral: 70,
    volumenMusica: 40,
    volumenEfectos: 70,
    melodia: 'gracia',
    vozActiva: false,
    velocidadVoz: 0.9,
    tamanoTexto: 'grande',
    altoContraste: false,
    tema: 'claro',
    cursorGrande: false,
  };
}

const uno = <T>(valor: unknown, opciones: readonly T[], porDefecto: T): T =>
  opciones.includes(valor as T) ? (valor as T) : porDefecto;
const bool = (valor: unknown, porDefecto: boolean) => (typeof valor === 'boolean' ? valor : porDefecto);
const num = (valor: unknown, min: number, max: number, porDefecto: number) =>
  typeof valor === 'number' && Number.isFinite(valor) ? Math.min(max, Math.max(min, valor)) : porDefecto;

/** Valida una configuración guardada (posiblemente incompleta o de otra versión). */
export function normalizarConfig(entrada: unknown): Configuracion {
  const d = configPorDefecto();
  const c = (entrada && typeof entrada === 'object' ? entrada : {}) as Record<string, unknown>;
  return {
    contenidoBiblico: bool(c.contenidoBiblico, d.contenidoBiblico),
    dificultad: uno(c.dificultad, Object.keys(MODOS) as Dificultad[], d.dificultad),
    ayudaAutomatica: bool(c.ayudaAutomatica, d.ayudaAutomatica),
    avisoBandeja: bool(c.avisoBandeja, d.avisoBandeja),
    calidad: uno(c.calidad, ['baja', 'media', 'alta', 'auto'] as const, d.calidad),
    fps: uno(c.fps, [30, 60, 0] as const, d.fps),
    animacionesReducidas: bool(c.animacionesReducidas, d.animacionesReducidas),
    mostrarFps: bool(c.mostrarFps, d.mostrarFps),
    volumenGeneral: num(c.volumenGeneral, 0, 100, d.volumenGeneral),
    volumenMusica: num(c.volumenMusica, 0, 100, d.volumenMusica),
    volumenEfectos: num(c.volumenEfectos, 0, 100, d.volumenEfectos),
    melodia: typeof c.melodia === 'string' ? c.melodia : d.melodia,
    vozActiva: bool(c.vozActiva, d.vozActiva),
    velocidadVoz: num(c.velocidadVoz, 0.6, 1.3, d.velocidadVoz),
    tamanoTexto: uno(c.tamanoTexto, ['normal', 'grande', 'muyGrande'] as const, d.tamanoTexto),
    altoContraste: bool(c.altoContraste, d.altoContraste),
    tema: uno(c.tema, ['claro', 'oscuro', 'auto'] as const, d.tema),
    cursorGrande: bool(c.cursorGrande, d.cursorGrande),
  };
}

/** Aplica al documento las opciones visuales (tema, texto, contraste, cursor, animaciones). */
export function aplicarConfigVisual(c: Configuracion): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.dataset.texto = c.tamanoTexto;
  html.dataset.contraste = c.altoContraste ? 'alto' : 'normal';
  html.dataset.cursor = c.cursorGrande ? 'grande' : 'normal';
  html.dataset.animaciones = c.animacionesReducidas ? 'reducidas' : 'completas';
  if (c.tema === 'auto') delete html.dataset.theme;
  else html.dataset.theme = c.tema === 'oscuro' ? 'dark' : 'light';
  // Color de la barra del navegador / app instalada.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.tema === 'oscuro' ? '#050507' : '#1d4e89');
}
