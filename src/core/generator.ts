import { LAYOUTS, baseCells, type Layout } from './layouts';
import { type ParamsNivel } from './difficulty';
import { rngFrom, shuffle, type Rng } from './rng';

export interface Ficha {
  id: number;
  /** Posición en medias unidades: cada ficha ocupa 2x2. */
  x: number;
  y: number;
  /** Capa (0 = base). */
  z: number;
  tipo: string;
}

export interface Tablero {
  fichas: Ficha[];
  /** cubiertaPor[i]: fichas de capas superiores que tapan a i. */
  cubiertaPor: number[][];
  /** cubre[i]: fichas de capas inferiores que i tapa. */
  cubre: number[][];
  ancho: number;
  alto: number;
  capas: number;
  layoutId: string;
  /** Un orden de retirada que resuelve el nivel con la bandeja indicada. */
  solucion: number[];
  protagonista: string | null;
}

type Pos = [number, number];
const clave = (x: number, y: number) => `${x},${y}`;

function vecinos(set: Set<string>, x: number, y: number): number {
  let n = 0;
  if (set.has(clave(x - 2, y))) n++;
  if (set.has(clave(x + 2, y))) n++;
  if (set.has(clave(x, y - 2))) n++;
  if (set.has(clave(x, y + 2))) n++;
  return n;
}

/** Deriva la capa superior: desplazada media ficha o alineada sobre el centro. */
function siguienteCapa(prev: Pos[], rng: Rng): Pos[] {
  const set = new Set(prev.map(([x, y]) => clave(x, y)));
  const desplazada: Pos[] = [];
  for (const [x, y] of prev) {
    if (set.has(clave(x + 2, y)) && set.has(clave(x, y + 2)) && set.has(clave(x + 2, y + 2))) {
      desplazada.push([x + 1, y + 1]);
    }
  }
  let alineada = prev.filter(([x, y]) => vecinos(set, x, y) === 4);
  if (alineada.length < 3) alineada = prev.filter(([x, y]) => vecinos(set, x, y) >= 3);

  if (desplazada.length >= 3 && (rng() < 0.6 || alineada.length < 3)) return desplazada;
  return alineada;
}

function construirCapas(layout: Layout, capas: number, rng: Rng): Pos[][] {
  const resultado: Pos[][] = [baseCells(layout)];
  while (resultado.length < capas) {
    const sig = siguienteCapa(resultado[resultado.length - 1], rng);
    if (sig.length === 0) break;
    resultado.push(sig);
  }
  return resultado;
}

const total = (capas: Pos[][]) => capas.reduce((s, c) => s + c.length, 0);

/** Quita fichas de la capa más alta, por los bordes y en espejo, hasta llegar a la meta. */
function recortar(capas: Pos[][], meta: number, rng: Rng): void {
  const base = capas[0];
  const minX = Math.min(...base.map((p) => p[0]));
  const maxX = Math.max(...base.map((p) => p[0]));
  let cuenta = total(capas);
  while (cuenta > meta) {
    let tope = capas.length - 1;
    while (capas[tope].length === 0) tope--;
    const capa = capas[tope];
    const set = new Set(capa.map(([x, y]) => clave(x, y)));
    const minVec = Math.min(...capa.map(([x, y]) => vecinos(set, x, y)));
    const bordes = capa.filter(([x, y]) => vecinos(set, x, y) === minVec);
    const [px, py] = bordes[Math.floor(rng() * bordes.length)];
    const espejo = minX + maxX - px;
    const quitar = new Set([clave(px, py)]);
    if (espejo !== px && set.has(clave(espejo, py)) && cuenta - 2 >= meta) quitar.add(clave(espejo, py));
    capas[tope] = capa.filter(([x, y]) => !quitar.has(clave(x, y)));
    cuenta -= quitar.size;
    if (capas[tope].length === 0 && tope > 0) capas.pop();
  }
}

const CAPAS_LIMITE = 6;

function elegirGeometria(meta: number, capasPedidas: number, rng: Rng): { layout: Layout; capas: Pos[][] } {
  // Si con las capas pedidas no caben las fichas, se agregan capas hasta que quepan.
  let numCapas = capasPedidas;
  let opciones: Array<{ layout: Layout; capas: Pos[][]; base: number; capacidad: number }>;
  do {
    opciones = LAYOUTS.map((layout) => {
      const capas = construirCapas(layout, numCapas, rng);
      return { layout, capas, base: capas[0].length, capacidad: total(capas) };
    });
  } while (!opciones.some((o) => o.capacidad >= meta) && ++numCapas <= CAPAS_LIMITE);

  let candidatas: typeof opciones;
  if (numCapas === 1) {
    candidatas = opciones.filter((o) => o.base >= meta && o.base <= meta * 1.35);
    if (candidatas.length === 0) {
      const mayores = opciones.filter((o) => o.base >= meta).sort((a, b) => a.base - b.base);
      candidatas = mayores.length ? [mayores[0]] : [opciones.sort((a, b) => b.base - a.base)[0]];
    }
  } else {
    candidatas = opciones.filter((o) => o.base <= meta && o.capacidad >= meta && o.base >= meta * 0.45);
    if (candidatas.length === 0) candidatas = opciones.filter((o) => o.base <= meta && o.capacidad >= meta);
    if (candidatas.length === 0) {
      const mayores = opciones.filter((o) => o.capacidad >= meta).sort((a, b) => a.base - b.base);
      candidatas = mayores.length ? [mayores[0]] : [opciones.sort((a, b) => b.capacidad - a.capacidad)[0]];
    }
  }
  const elegida = candidatas[Math.floor(rng() * candidatas.length)];
  const capas = elegida.capas.map((c) => c.map((p) => [p[0], p[1]] as Pos));
  recortar(capas, Math.floor(Math.min(meta, elegida.capacidad) / 3) * 3, rng);
  return { layout: elegida.layout, capas };
}

export function calcularCoberturas(fichas: Ficha[]): { cubiertaPor: number[][]; cubre: number[][] } {
  const cubiertaPor: number[][] = fichas.map(() => []);
  const cubre: number[][] = fichas.map(() => []);
  for (const a of fichas) {
    for (const b of fichas) {
      if (b.z > a.z && Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2) {
        cubiertaPor[a.id].push(b.id);
        cubre[b.id].push(a.id);
      }
    }
  }
  return { cubiertaPor, cubre };
}

/** Simula una partida tomando siempre una ficha libre al azar. */
function ordenDeRetirada(n: number, cubiertaPor: number[][], cubre: number[][], rng: Rng): number[] {
  const tapas = cubiertaPor.map((l) => l.length);
  const libres: number[] = [];
  for (let i = 0; i < n; i++) if (tapas[i] === 0) libres.push(i);
  const orden: number[] = [];
  while (libres.length) {
    const k = Math.floor(rng() * libres.length);
    const id = libres[k];
    libres[k] = libres[libres.length - 1];
    libres.pop();
    orden.push(id);
    for (const debajo of cubre[id]) {
      tapas[debajo]--;
      if (tapas[debajo] === 0) libres.push(debajo);
    }
  }
  return orden;
}

/** Lista de tipos por grupo (cada grupo = un trío). La protagonista es la que más aparece. */
function tiposPorGrupo(grupos: number, tipos: string[], protagonista: string | null, rng: Rng): string[] {
  const lista = [...tipos];
  const extras: string[] = [];
  const otros = shuffle(rng, tipos.filter((t) => t !== protagonista));
  const ronda = protagonista ? [protagonista, ...otros] : otros;
  for (let i = 0; extras.length < grupos - tipos.length; i++) extras.push(ronda[i % ronda.length]);
  return shuffle(rng, [...lista, ...extras]);
}

/**
 * Asigna tipos siguiendo el orden de retirada, de modo que jugando en ese
 * orden la bandeja nunca pase de `limite` fichas. Así el nivel siempre tiene solución.
 */
function asignarTipos(orden: number[], grupos: string[], ventana: number, limite: number, rng: Rng): Map<number, string> {
  const resultado = new Map<number, string>();
  const abiertos: Array<{ tipo: string; cuenta: number }> = [];
  let gi = 0;
  for (let paso = 0; paso < orden.length; paso++) {
    const restantes = orden.length - paso;
    const pendientes = abiertos.reduce((s, g) => s + (3 - g.cuenta), 0);
    const ocupacion = abiertos.reduce((s, g) => s + g.cuenta, 0);
    const hayDos = abiertos.some((g) => g.cuenta === 2);
    const puedeAbrir =
      gi < grupos.length &&
      abiertos.length < ventana &&
      ocupacion + 1 <= limite &&
      (hayDos || ocupacion + 2 <= limite) &&
      restantes >= pendientes + 3;

    let grupo: { tipo: string; cuenta: number };
    if (abiertos.length === 0 || (puedeAbrir && rng() < 0.55)) {
      const enUso = new Set(abiertos.map((g) => g.tipo));
      if (enUso.has(grupos[gi])) {
        const j = grupos.findIndex((t, k) => k > gi && !enUso.has(t));
        if (j > gi) [grupos[gi], grupos[j]] = [grupos[j], grupos[gi]];
      }
      grupo = { tipo: grupos[gi++], cuenta: 0 };
      abiertos.push(grupo);
    } else {
      const validos = abiertos.filter((g) => g.cuenta === 2 || ocupacion + 1 <= limite);
      grupo = validos[Math.floor(rng() * validos.length)];
    }
    grupo.cuenta++;
    resultado.set(orden[paso], grupo.tipo);
    if (grupo.cuenta === 3) abiertos.splice(abiertos.indexOf(grupo), 1);
  }
  return resultado;
}

export interface OpcionesGeneracion {
  /** Tipos de ficha disponibles (ids del catálogo). */
  pool: string[];
  /** Tipo que debe aparecer más (relacionado con el versículo del nivel). */
  protagonista?: string | null;
  semilla?: string;
}

export function semillaNivel(p: ParamsNivel): string {
  return `mcl-tiles:${p.nivel}:${p.dificultad}:${p.masFacil ? 'facil' : 'std'}`;
}

export function generarTablero(p: ParamsNivel, opciones: OpcionesGeneracion): Tablero {
  const rng = rngFrom(opciones.semilla ?? semillaNivel(p));
  const { layout, capas } = elegirGeometria(p.fichas, p.capas, rng);

  const fichas: Ficha[] = [];
  capas.forEach((capa, z) => capa.forEach(([x, y]) => fichas.push({ id: fichas.length, x, y, z, tipo: '' })));
  const n = fichas.length;
  const minX = Math.min(...fichas.map((f) => f.x));
  const minY = Math.min(...fichas.map((f) => f.y));
  for (const f of fichas) {
    f.x -= minX;
    f.y -= minY;
  }

  const { cubiertaPor, cubre } = calcularCoberturas(fichas);
  const solucion = ordenDeRetirada(n, cubiertaPor, cubre, rng);

  const numGrupos = n / 3;
  const protagonista = opciones.protagonista && opciones.pool.includes(opciones.protagonista) ? opciones.protagonista : null;
  const k = Math.max(1, Math.min(p.tipos, opciones.pool.length, numGrupos));
  const resto = shuffle(rng, opciones.pool.filter((t) => t !== protagonista));
  const tipos = protagonista ? [protagonista, ...resto.slice(0, k - 1)] : resto.slice(0, k);
  const grupos = tiposPorGrupo(numGrupos, tipos, protagonista, rng);
  const limite = Math.max(2, p.bandeja - p.margen);
  const asignacion = asignarTipos(solucion, grupos, p.ventana, limite, rng);
  for (const f of fichas) f.tipo = asignacion.get(f.id)!;

  return {
    fichas,
    cubiertaPor,
    cubre,
    ancho: Math.max(...fichas.map((f) => f.x)) + 2,
    alto: Math.max(...fichas.map((f) => f.y)) + 2,
    capas: Math.max(...fichas.map((f) => f.z)) + 1,
    layoutId: layout.id,
    solucion,
    protagonista,
  };
}
