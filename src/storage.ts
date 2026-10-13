import { configPorDefecto, normalizarConfig, type Configuracion } from './settings/settings';
import { ARTICULOS_POR_ID, GRATIS, ORDEN_AYUDAS, type IdAyuda } from './economy/shop';

export interface VersiculoRecibido {
  id: number;
  nivel: number;
  fecha: string;
}

export interface Guardado {
  v: 1;
  nombre: string | null;
  invitado: boolean;
  /** Nivel más alto desbloqueado. */
  nivelActual: number;
  estrellas: Record<string, number>;
  talentos: number;
  ayudas: Record<IdAyuda, number>;
  compras: string[];
  equipado: { fondo: string; estilo: string; tarjeta: string };
  versiculos: VersiculoRecibido[];
  favoritos: number[];
  indicePregunta: number;
  preguntaDia: string | null;
  racha: { dias: number; ultima: string | null };
  ganaHoy: { fecha: string | null; veces: number };
  fallos: Record<string, number>;
  masFacil: number[];
  nivelesDesdeCofre: number;
  config: Configuracion;
}

export const CLAVE_GUARDADO = 'mcl-tiles:v1';

export function guardadoNuevo(): Guardado {
  return {
    v: 1,
    nombre: null,
    invitado: false,
    nivelActual: 1,
    estrellas: {},
    talentos: 50,
    ayudas: { deshacer: 2, barajar: 2, lampara: 2, espacio: 2 },
    compras: [...GRATIS],
    equipado: { fondo: 'amanecer', estilo: 'marfil', tarjeta: 'sencilla' },
    versiculos: [],
    favoritos: [],
    indicePregunta: 0,
    preguntaDia: null,
    racha: { dias: 0, ultima: null },
    ganaHoy: { fecha: null, veces: 0 },
    fallos: {},
    masFacil: [],
    nivelesDesdeCofre: 0,
    config: configPorDefecto(),
  };
}

const entero = (v: unknown, min: number, porDefecto: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.floor(v)) : porDefecto;
const fecha = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const esObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function registroNumerico(v: unknown): Record<string, number> {
  const resultado: Record<string, number> = {};
  if (!esObjeto(v)) return resultado;
  for (const [k, n] of Object.entries(v)) if (typeof n === 'number' && Number.isFinite(n)) resultado[k] = n;
  return resultado;
}

/** Valida datos guardados: cualquier campo dañado vuelve a su valor por defecto. */
export function normalizarGuardado(entrada: unknown): Guardado {
  const base = guardadoNuevo();
  if (!esObjeto(entrada)) return base;
  const g = entrada;
  const compras = Array.isArray(g.compras)
    ? [...new Set([...GRATIS, ...g.compras.filter((c): c is string => typeof c === 'string' && ARTICULOS_POR_ID.has(c))])]
    : base.compras;
  const equipadoEntrada = esObjeto(g.equipado) ? g.equipado : {};
  const equipado = { ...base.equipado };
  for (const k of ['fondo', 'estilo', 'tarjeta'] as const) {
    const valor = equipadoEntrada[k];
    if (typeof valor === 'string' && compras.includes(valor) && ARTICULOS_POR_ID.get(valor)?.categoria === k) equipado[k] = valor;
  }
  const ayudasEntrada = esObjeto(g.ayudas) ? g.ayudas : {};
  const ayudas = { ...base.ayudas };
  for (const id of ORDEN_AYUDAS) ayudas[id] = entero(ayudasEntrada[id], 0, base.ayudas[id]);
  const config = normalizarConfig(g.config);
  if (!compras.includes(config.melodia)) config.melodia = 'gracia';
  const racha = esObjeto(g.racha) ? g.racha : {};
  const ganaHoy = esObjeto(g.ganaHoy) ? g.ganaHoy : {};

  return {
    v: 1,
    nombre: typeof g.nombre === 'string' ? limpiarNombre(g.nombre) : null,
    invitado: g.invitado === true,
    nivelActual: entero(g.nivelActual, 1, 1),
    estrellas: registroNumerico(g.estrellas),
    talentos: entero(g.talentos, 0, base.talentos),
    ayudas,
    compras,
    equipado,
    versiculos: Array.isArray(g.versiculos)
      ? g.versiculos
          .filter((v): v is Record<string, unknown> => esObjeto(v) && typeof v.id === 'number' && typeof v.nivel === 'number')
          .map((v) => ({ id: v.id as number, nivel: v.nivel as number, fecha: fecha(v.fecha) ?? '' }))
      : [],
    favoritos: Array.isArray(g.favoritos) ? g.favoritos.filter((f): f is number => typeof f === 'number') : [],
    indicePregunta: entero(g.indicePregunta, 0, 0),
    preguntaDia: fecha(g.preguntaDia),
    racha: { dias: entero(racha.dias, 0, 0), ultima: fecha(racha.ultima) },
    ganaHoy: { fecha: fecha(ganaHoy.fecha), veces: entero(ganaHoy.veces, 0, 0) },
    fallos: registroNumerico(g.fallos),
    masFacil: Array.isArray(g.masFacil) ? g.masFacil.filter((n): n is number => typeof n === 'number') : [],
    nivelesDesdeCofre: entero(g.nivelesDesdeCofre, 0, 0),
    config,
  };
}

/** Nombre del jugador: 1 a 20 caracteres; letras (con tildes y ñ), espacios, punto, apóstrofo y guion. */
export function limpiarNombre(texto: string): string | null {
  const limpio = texto.replace(/\s+/g, ' ').trim().slice(0, 20);
  return /^[\p{L}\p{M} .'-]{1,20}$/u.test(limpio) ? limpio : null;
}

function almacenSeguro(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function cargar(almacen: Pick<Storage, 'getItem'> | null = almacenSeguro()): Guardado {
  try {
    const texto = almacen?.getItem(CLAVE_GUARDADO);
    return texto ? normalizarGuardado(JSON.parse(texto)) : guardadoNuevo();
  } catch {
    return guardadoNuevo();
  }
}

export function guardar(g: Guardado, almacen: Pick<Storage, 'setItem'> | null = almacenSeguro()): void {
  try {
    almacen?.setItem(CLAVE_GUARDADO, JSON.stringify(g));
  } catch {
    // Sin almacenamiento (ventana privada o bloqueado): el juego sigue en memoria.
  }
}

/** Código para llevar el progreso a otro navegador. */
export function exportarCodigo(g: Guardado): string {
  const bytes = new TextEncoder().encode(JSON.stringify(g));
  let binario = '';
  bytes.forEach((b) => (binario += String.fromCharCode(b)));
  return 'MCL1-' + btoa(binario);
}

export function importarCodigo(codigo: string): Guardado | null {
  try {
    const limpio = codigo.trim().replace(/^MCL1-/, '').replace(/\s+/g, '');
    const binario = atob(limpio);
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    const datos = JSON.parse(new TextDecoder().decode(bytes));
    if (!esObjeto(datos) || datos.v !== 1) return null;
    return normalizarGuardado(datos);
  } catch {
    return null;
  }
}
