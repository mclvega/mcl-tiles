/**
 * Fichas de animalitos para los niveles temáticos («solo perritos», «solo
 * gatitos»…). Cada animal tiene 6 variantes que se distinguen a la vez por el
 * color del pelaje, el color del fondo y un accesorio, para que sean fáciles
 * de reconocer.
 */
import { type TipoFicha } from './tiles';

type Accesorio = 'ninguno' | 'mono' | 'sombrero' | 'collar' | 'lentes' | 'flor';

interface Variante {
  pelaje: string;
  detalle: string;
  fondo: string;
  accesorio: Accesorio;
  nombre: string;
}

/** Fondos fuertes y bien distintos entre sí: rojo, azul, verde, amarillo, morado y naranja. */
const FONDOS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];
const ACCESORIOS: Accesorio[] = ['ninguno', 'mono', 'sombrero', 'collar', 'lentes', 'flor'];
const NOMBRES_ACCESORIO: Record<Accesorio, string> = {
  ninguno: '',
  mono: 'con moño',
  sombrero: 'con sombrero',
  collar: 'con collar',
  lentes: 'con lentes',
  flor: 'con flor',
};

function accesorio(a: Accesorio): string {
  switch (a) {
    case 'mono':
      return `<path d="M24 9 L32 13 L40 9 L40 19 L32 15 L24 19 Z" fill="#e53935"/><circle cx="32" cy="14" r="3" fill="#b71c1c"/>`;
    case 'sombrero':
      return `<ellipse cx="32" cy="15" rx="17" ry="4" fill="#1e5aa8"/><path d="M22 15 V6 Q32 2 42 6 V15 Z" fill="#1e88e5"/><rect x="22" y="11" width="20" height="3" fill="#fdd835" stroke="none"/>`;
    case 'collar':
      return `<path d="M17 52 Q32 60 47 52" fill="none" stroke="#2e7d32" stroke-width="5"/><circle cx="32" cy="58" r="4" fill="#fdd835"/>`;
    case 'lentes':
      return `<circle cx="25" cy="31" r="6" fill="rgba(255,255,255,0.35)" stroke-width="3"/><circle cx="39" cy="31" r="6" fill="rgba(255,255,255,0.35)" stroke-width="3"/><path d="M31 31 H33" stroke-width="3"/>`;
    case 'flor':
      return `<g transform="translate(47 15)"><circle cx="0" cy="-5" r="4" fill="#f06292"/><circle cx="5" cy="0" r="4" fill="#f06292"/><circle cx="0" cy="5" r="4" fill="#f06292"/><circle cx="-5" cy="0" r="4" fill="#f06292"/><circle cx="0" cy="0" r="3" fill="#fdd835"/></g>`;
    default:
      return '';
  }
}

const ojos = `<circle cx="25" cy="31" r="2.6" fill="#2b2118" stroke="none"/><circle cx="39" cy="31" r="2.6" fill="#2b2118" stroke="none"/>`;

const DIBUJOS: Record<string, (v: Variante) => string> = {
  perrito: (v) => `
    <ellipse cx="15" cy="30" rx="7" ry="14" transform="rotate(15 15 30)" fill="${v.detalle}"/>
    <ellipse cx="49" cy="30" rx="7" ry="14" transform="rotate(-15 49 30)" fill="${v.detalle}"/>
    <circle cx="32" cy="34" r="17" fill="${v.pelaje}"/>
    <ellipse cx="32" cy="42" rx="9" ry="7" fill="#fff4e0"/>
    <ellipse cx="32" cy="38" rx="3.5" ry="2.6" fill="#2b2118"/>
    <path d="M30 46 Q32 50 34 46" fill="#ff8a80"/>
    ${ojos}`,
  gatito: (v) => `
    <path d="M17 26 L19 9 L30 19 Z" fill="${v.pelaje}"/><path d="M47 26 L45 9 L34 19 Z" fill="${v.pelaje}"/>
    <path d="M20 21 L21 13 L26 18 Z" fill="#f8bbd0" stroke="none"/><path d="M44 21 L43 13 L38 18 Z" fill="#f8bbd0" stroke="none"/>
    <circle cx="32" cy="34" r="17" fill="${v.pelaje}"/>
    <path d="M24 22 Q32 26 40 22" fill="none" stroke="${v.detalle}" stroke-width="3"/>
    <path d="M30 39 L34 39 L32 42 Z" fill="#f48fb1"/>
    <path d="M32 42 Q29 45 27 43 M32 42 Q35 45 37 43" fill="none" stroke-width="1.8"/>
    <path d="M14 38 H24 M14 43 L24 41 M50 38 H40 M50 43 L40 41" stroke-width="1.5"/>
    ${ojos}`,
  vaquita: (v) => `
    <path d="M18 18 Q14 10 20 8 M46 18 Q50 10 44 8" fill="none" stroke="#e0c08a" stroke-width="4"/>
    <ellipse cx="12" cy="28" rx="7" ry="4" transform="rotate(-20 12 28)" fill="${v.pelaje}"/>
    <ellipse cx="52" cy="28" rx="7" ry="4" transform="rotate(20 52 28)" fill="${v.pelaje}"/>
    <rect x="16" y="15" width="32" height="38" rx="15" fill="${v.pelaje}"/>
    <path d="M18 24 Q24 18 28 24 Q26 30 19 29 Z" fill="${v.detalle}" stroke="none"/>
    <path d="M40 18 Q47 20 46 28 Q41 27 39 22 Z" fill="${v.detalle}" stroke="none"/>
    <ellipse cx="32" cy="46" rx="13" ry="8" fill="#f8bbd0"/>
    <ellipse cx="27" cy="46" rx="2" ry="2.6" fill="#2b2118" stroke="none"/><ellipse cx="37" cy="46" rx="2" ry="2.6" fill="#2b2118" stroke="none"/>
    ${ojos}`,
  caballito: (v) => `
    <path d="M22 15 L24 4 L30 13 Z M42 15 L40 4 L34 13 Z" fill="${v.pelaje}"/>
    <ellipse cx="32" cy="33" rx="14" ry="21" fill="${v.pelaje}"/>
    <path d="M27 11 Q32 6 37 11 L36 24 Q32 20 28 24 Z" fill="${v.detalle}"/>
    <ellipse cx="32" cy="47" rx="11" ry="8" fill="#f3e1c9"/>
    <ellipse cx="28" cy="48" rx="1.8" ry="2.4" fill="#2b2118" stroke="none"/><ellipse cx="36" cy="48" rx="1.8" ry="2.4" fill="#2b2118" stroke="none"/>
    ${ojos}`,
  conejito: (v) => `
    <ellipse cx="24" cy="14" rx="5.5" ry="13" fill="${v.pelaje}"/><ellipse cx="40" cy="14" rx="5.5" ry="13" fill="${v.pelaje}"/>
    <ellipse cx="24" cy="15" rx="2.5" ry="9" fill="#f8bbd0" stroke="none"/><ellipse cx="40" cy="15" rx="2.5" ry="9" fill="#f8bbd0" stroke="none"/>
    <circle cx="32" cy="37" r="16" fill="${v.pelaje}"/>
    <circle cx="23" cy="42" r="4" fill="${v.detalle}" stroke="none" opacity="0.7"/><circle cx="41" cy="42" r="4" fill="${v.detalle}" stroke="none" opacity="0.7"/>
    <path d="M30 40 L34 40 L32 43 Z" fill="#f48fb1"/>
    <rect x="29" y="44" width="6" height="5" rx="1" fill="#ffffff"/>
    <circle cx="25" cy="34" r="2.6" fill="#2b2118" stroke="none"/><circle cx="39" cy="34" r="2.6" fill="#2b2118" stroke="none"/>`,
  pollito: (v) => `
    <path d="M28 12 Q30 4 33 11 Q36 5 37 13" fill="none" stroke="${v.detalle}" stroke-width="3"/>
    <circle cx="32" cy="35" r="19" fill="${v.pelaje}"/>
    <ellipse cx="15" cy="40" rx="5" ry="9" transform="rotate(20 15 40)" fill="${v.detalle}"/>
    <ellipse cx="49" cy="40" rx="5" ry="9" transform="rotate(-20 49 40)" fill="${v.detalle}"/>
    <path d="M27 38 L37 38 L32 45 Z" fill="#ff9800"/>
    <circle cx="22" cy="40" r="3" fill="#ff8a80" stroke="none"/><circle cx="42" cy="40" r="3" fill="#ff8a80" stroke="none"/>
    ${ojos}`,
};

/** Pelajes de cada animal: [pelaje, detalle, nombre del color]. */
const PELAJES: Record<string, Array<[string, string, string]>> = {
  perrito: [['#c68642', '#8d5524', 'café'], ['#f5deb3', '#c9a26b', 'crema'], ['#6d4c41', '#3e2723', 'chocolate'], ['#fafafa', '#9e9e9e', 'blanco'], ['#e0a96d', '#b5713a', 'dorado'], ['#9e9e9e', '#616161', 'gris']],
  gatito: [['#ffb74d', '#e65100', 'naranja'], ['#9e9e9e', '#424242', 'gris'], ['#fafafa', '#bdbdbd', 'blanco'], ['#5d4037', '#2b1d18', 'café'], ['#ffe0b2', '#ff8a65', 'crema'], ['#424242', '#111111', 'negro']],
  vaquita: [['#ffffff', '#2b2118', 'blanca y negra'], ['#ffffff', '#8d5524', 'blanca y café'], ['#d7b48a', '#8d5524', 'canela'], ['#fff3e0', '#e65100', 'con manchas naranja'], ['#eeeeee', '#616161', 'gris'], ['#a1887f', '#4e342e', 'café']],
  caballito: [['#8d5524', '#2b1d18', 'café'], ['#fafafa', '#bdbdbd', 'blanco'], ['#424242', '#111111', 'negro'], ['#e0a96d', '#fff3e0', 'dorado'], ['#bcaaa4', '#5d4037', 'gris'], ['#c62828', '#4e1010', 'rojizo']],
  conejito: [['#fafafa', '#f48fb1', 'blanco'], ['#bcaaa4', '#8d6e63', 'gris'], ['#d7a86e', '#a1672e', 'canela'], ['#5d4037', '#3e2723', 'café'], ['#ffe0b2', '#ffab91', 'crema'], ['#9e9e9e', '#616161', 'plomo']],
  pollito: [['#ffeb3b', '#f9a825', 'amarillo'], ['#fff59d', '#fbc02d', 'claro'], ['#ffcc80', '#ef6c00', 'naranja'], ['#fafafa', '#bdbdbd', 'blanco'], ['#ffe082', '#8d6e63', 'dorado'], ['#d7ccc8', '#6d4c41', 'pardo']],
};

export interface Tema {
  id: string;
  nombre: string;
  icono: string;
  animal: string;
}

export const TEMAS: Tema[] = [
  { id: 'perritos', nombre: 'Nivel de perritos', icono: '🐶', animal: 'perrito' },
  { id: 'gatitos', nombre: 'Nivel de gatitos', icono: '🐱', animal: 'gatito' },
  { id: 'vaquitas', nombre: 'Nivel de vaquitas', icono: '🐮', animal: 'vaquita' },
  { id: 'caballitos', nombre: 'Nivel de caballitos', icono: '🐴', animal: 'caballito' },
  { id: 'conejitos', nombre: 'Nivel de conejitos', icono: '🐰', animal: 'conejito' },
  { id: 'pollitos', nombre: 'Nivel de pollitos', icono: '🐥', animal: 'pollito' },
];

const NOMBRE_ANIMAL: Record<string, string> = {
  perrito: 'Perrito', gatito: 'Gatito', vaquita: 'Vaquita', caballito: 'Caballito', conejito: 'Conejito', pollito: 'Pollito',
};

export const FICHAS_ANIMALITOS: TipoFicha[] = TEMAS.flatMap((tema) =>
  PELAJES[tema.animal].map(([pelaje, detalle, color], i) => {
    const v: Variante = { pelaje, detalle, fondo: FONDOS[i], accesorio: ACCESORIOS[i], nombre: color };
    const nombre = [NOMBRE_ANIMAL[tema.animal], color, NOMBRES_ACCESORIO[v.accesorio]].filter(Boolean).join(' ');
    return {
      id: `${tema.animal}-${i}`,
      nombre,
      svg: `<circle cx="32" cy="32" r="30" fill="${v.fondo}" stroke="none"/>${DIBUJOS[tema.animal](v)}${accesorio(v.accesorio)}`,
      desdeVuelta: Number.POSITIVE_INFINITY,
    };
  }),
);

/** Tema del nivel temático n (rota entre todos los animales). */
export function temaDeNivel(n: number): Tema {
  // Cada nivel del bloque de animalitos trae un animal distinto.
  return TEMAS[n % TEMAS.length];
}

export function poolDeTema(tema: Tema): string[] {
  return FICHAS_ANIMALITOS.filter((f) => f.id.startsWith(`${tema.animal}-`)).map((f) => f.id);
}
