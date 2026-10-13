/**
 * Catálogo de fichas. Cada ícono es un SVG propio (viewBox 64x64) con contorno
 * grueso y color plano, para que se distinga por forma y por color.
 * Animalitos, instrumentos de alabanza y símbolos bíblicos, sin imágenes de personas.
 */
export interface TipoFicha {
  id: string;
  nombre: string;
  /** Contenido SVG interno (dentro de un grupo con contorno). */
  svg: string;
  /** Vuelta del recorrido a partir de la cual aparece. */
  desdeVuelta: number;
}

const T = (id: string, nombre: string, svg: string, desdeVuelta = 1): TipoFicha => ({ id, nombre, svg, desdeVuelta });

export const FICHAS: TipoFicha[] = [
  T(
    'cordero',
    'Cordero',
    `<circle cx="32" cy="32" r="28" fill="#e3f1d4" stroke="none"/>
     <path d="M23 44 V56 M31 45 V56 M39 45 V56 M46 43 V55" stroke-width="4"/>
     <path d="M17 40 Q11 34 17 28 Q17 20 26 21 Q31 14 38 19 Q46 16 48 24 Q55 27 51 35 Q53 44 44 44 Q37 49 30 45 Q21 48 17 40 Z" fill="#ffffff"/>
     <path d="M9 22 L3 19 L8 26 Z" fill="#6d6d6d"/>
     <ellipse cx="14" cy="27" rx="7" ry="8" fill="#6d6d6d"/>
     <circle cx="12" cy="26" r="1.4" fill="#ffffff" stroke="none"/>`,
  ),
  T(
    'paloma',
    'Paloma',
    `<circle cx="32" cy="32" r="28" fill="#cfe6fb" stroke="none"/>
     <path d="M8 37 Q20 30 34 34 Q44 36 50 30 Q54 27 57 29 L55 33 Q50 43 37 45 Q22 47 8 37 Z" fill="#ffffff"/>
     <path d="M22 35 Q23 15 41 9 Q39 25 34 35 Z" fill="#ffffff"/>
     <circle cx="51" cy="30.5" r="1.4" fill="#2b2118" stroke="none"/>
     <path d="M56 29 L62 30.5 L56 32.5 Z" fill="#f39c12"/>`,
  ),
  T(
    'leon',
    'León de Judá',
    `<path d="M32 4 L38 9 L46 7 L49 15 L57 18 L55 26 L60 32 L55 38 L57 46 L49 49 L46 57 L38 55 L32 60 L26 55 L18 57 L15 49 L7 46 L9 38 L4 32 L9 26 L7 18 L15 15 L18 7 L26 9 Z" fill="#b5541a"/>
     <circle cx="21" cy="20" r="5" fill="#f2b84b"/><circle cx="43" cy="20" r="5" fill="#f2b84b"/>
     <circle cx="32" cy="34" r="16" fill="#f2b84b"/>
     <circle cx="26" cy="30" r="2" fill="#2b2118" stroke="none"/><circle cx="38" cy="30" r="2" fill="#2b2118" stroke="none"/>
     <path d="M28 37 H36 L32 42 Z" fill="#5a3415"/>
     <path d="M32 42 Q28 47 25 45 M32 42 Q36 47 39 45" fill="none" stroke-width="2"/>`,
  ),
  T(
    'pez',
    'Pez',
    `<path d="M6 32 Q21 13 42 24 L57 13 L54 32 L57 51 L42 40 Q21 51 6 32 Z" fill="#5dade2"/>
     <circle cx="17" cy="29" r="2.6" fill="#2b2118" stroke="none"/>
     <path d="M26 25 Q30 32 26 39 M33 26 Q37 32 33 38" fill="none" stroke-width="2"/>`,
  ),
  T(
    'camello',
    'Camello',
    `<circle cx="32" cy="32" r="29" fill="#fff1d6" stroke="none"/>
     <path d="M16 44 V58 M24 44 V58 M40 44 V58 M48 44 V58" stroke-width="4.5"/>
     <path d="M9 44 Q9 34 17 32 Q22 18 30 29 Q36 17 44 30 Q50 30 50 23 L50 13 Q54 8 59 13 L59 19 L54 21 L54 34 Q54 44 46 44 Z" fill="#d9a35b"/>
     <circle cx="55.5" cy="14.5" r="1.6" fill="#2b2118" stroke="none"/>`,
  ),
  T(
    'burro',
    'Burrito',
    `<circle cx="32" cy="32" r="29" fill="#e8f4ff" stroke="none"/>
     <ellipse cx="20" cy="15" rx="5.5" ry="13" transform="rotate(-20 20 15)" fill="#9e9e9e"/>
     <ellipse cx="44" cy="15" rx="5.5" ry="13" transform="rotate(20 44 15)" fill="#9e9e9e"/>
     <ellipse cx="20" cy="16" rx="2.5" ry="8" transform="rotate(-20 20 16)" fill="#f4a7b9" stroke="none"/>
     <ellipse cx="44" cy="16" rx="2.5" ry="8" transform="rotate(20 44 16)" fill="#f4a7b9" stroke="none"/>
     <ellipse cx="32" cy="35" rx="15" ry="17" fill="#b5b5b5"/>
     <ellipse cx="32" cy="48" rx="11" ry="9" fill="#ececec"/>
     <circle cx="26" cy="31" r="2.4" fill="#2b2118" stroke="none"/><circle cx="38" cy="31" r="2.4" fill="#2b2118" stroke="none"/>
     <circle cx="28" cy="48" r="1.6" fill="#2b2118" stroke="none"/><circle cx="36" cy="48" r="1.6" fill="#2b2118" stroke="none"/>`,
  ),
  T(
    'aguila',
    'Águila',
    `<circle cx="32" cy="32" r="29" fill="#d6efff" stroke="none"/>
     <path d="M3 31 Q17 12 32 27 Q47 12 61 31 Q47 31 41 39 L23 39 Q17 31 3 31 Z" fill="#8d5524"/>
     <path d="M25 38 L32 54 L39 38 Z" fill="#ffffff"/>
     <circle cx="32" cy="24" r="8.5" fill="#ffffff"/>
     <path d="M37 22 L46 25.5 L37 29 Z" fill="#ffb300"/>
     <circle cx="34" cy="22" r="1.5" fill="#2b2118" stroke="none"/>`,
  ),
  T(
    'rana',
    'Ranita',
    `<circle cx="32" cy="32" r="29" fill="#fff7c2" stroke="none"/>
     <ellipse cx="32" cy="41" rx="24" ry="16" fill="#43a047"/>
     <circle cx="20" cy="24" r="9" fill="#66bb6a"/><circle cx="44" cy="24" r="9" fill="#66bb6a"/>
     <circle cx="20" cy="24" r="5" fill="#ffffff"/><circle cx="44" cy="24" r="5" fill="#ffffff"/>
     <circle cx="21" cy="25" r="2.4" fill="#2b2118" stroke="none"/><circle cx="45" cy="25" r="2.4" fill="#2b2118" stroke="none"/>
     <path d="M20 43 Q32 52 44 43" fill="none" stroke-width="3"/>
     <circle cx="15" cy="44" r="3" fill="#ff8a80" stroke="none"/><circle cx="49" cy="44" r="3" fill="#ff8a80" stroke="none"/>`,
  ),
  T(
    'abeja',
    'Abejita',
    `<circle cx="32" cy="32" r="29" fill="#e3f9e5" stroke="none"/>
     <ellipse cx="26" cy="18" rx="8" ry="11" transform="rotate(-20 26 18)" fill="#e3f2fd"/>
     <ellipse cx="40" cy="18" rx="8" ry="11" transform="rotate(20 40 18)" fill="#e3f2fd"/>
     <ellipse cx="34" cy="38" rx="19" ry="14" fill="#ffca28"/>
     <path d="M30 25 Q27 38 30 51 M40 26 Q43 38 40 50" stroke-width="5"/>
     <path d="M53 38 L60 38" stroke-width="3"/>
     <circle cx="15" cy="38" r="8" fill="#4e342e"/>
     <circle cx="13" cy="36" r="2" fill="#ffffff" stroke="none"/>`,
  ),
  T(
    'arpa',
    'Arpa de David',
    `<circle cx="32" cy="32" r="28" fill="#e8dcf5" stroke="none"/>
     <path d="M20 13 V55 M26 13 V55 M32 17 V55 M38 25 V55 M44 29 V55" stroke="#7f6a3a" stroke-width="1.6"/>
     <path d="M14 55 L14 10 Q30 8 34 18 Q40 30 51 30 L51 55" fill="none" stroke-width="8"/>
     <path d="M14 55 L14 10 Q30 8 34 18 Q40 30 51 30 L51 55" fill="none" stroke="#d99a06" stroke-width="4.5"/>
     <rect x="9" y="53" width="47" height="7" rx="2" fill="#d99a06"/>`,
  ),
  T(
    'shofar',
    'Shofar',
    `<path d="M7 51 Q9 38 22 34 Q40 28 45 16 L57 9 Q56 26 50 31 Q40 46 22 49 Q14 51 12 56 Z" fill="#ecd3a4"/>
     <path d="M20 36 Q23 42 20 48 M32 31 Q36 38 33 45" fill="none" stroke-width="2.2"/>
     <ellipse cx="52" cy="16" rx="5" ry="8" transform="rotate(35 52 16)" fill="#b88d4f"/>`,
  ),
  T(
    'pandero',
    'Pandero',
    `<circle cx="32" cy="31" r="24" fill="#e03b2e"/>
     <circle cx="32" cy="31" r="16" fill="#fdebd0"/>
     <circle cx="32" cy="7" r="4" fill="#f1c40f"/><circle cx="56" cy="31" r="4" fill="#f1c40f"/>
     <circle cx="8" cy="31" r="4" fill="#f1c40f"/><circle cx="49" cy="14" r="4" fill="#f1c40f"/>
     <circle cx="15" cy="14" r="4" fill="#f1c40f"/>
     <path d="M44 51 Q50 58 46 63 M38 54 Q40 60 36 63" fill="none" stroke="#8e44ad" stroke-width="3"/>`,
  ),
  T(
    'guitarra',
    'Guitarra',
    `<g transform="rotate(-38 32 32)">
       <rect x="29" y="3" width="6" height="27" fill="#5c3a1e"/>
       <rect x="27" y="0" width="10" height="7" rx="2" fill="#3d2614"/>
       <path d="M32 26 Q20 24 20 36 Q15 44 21 52 Q32 61 43 52 Q49 44 44 36 Q44 24 32 26 Z" fill="#e67e22"/>
       <circle cx="32" cy="41" r="5" fill="#3d2614"/>
       <rect x="27" y="50" width="10" height="3" fill="#3d2614"/>
     </g>`,
  ),
  T(
    'flauta',
    'Flauta',
    `<circle cx="32" cy="32" r="29" fill="#fde4f2" stroke="none"/>
     <g transform="rotate(-35 32 32)">
       <rect x="5" y="27" width="54" height="10" rx="5" fill="#ab47bc"/>
       <rect x="5" y="27" width="9" height="10" rx="4" fill="#7b1fa2"/>
       <circle cx="24" cy="32" r="2.2" fill="#2b2118" stroke="none"/><circle cx="32" cy="32" r="2.2" fill="#2b2118" stroke="none"/>
       <circle cx="40" cy="32" r="2.2" fill="#2b2118" stroke="none"/><circle cx="48" cy="32" r="2.2" fill="#2b2118" stroke="none"/>
     </g>
     <path d="M48 10 Q52 6 55 10 M52 16 Q57 13 59 17" fill="none" stroke="#e91e63" stroke-width="2.5"/>`,
  ),
  T(
    'cimbalos',
    'Címbalos',
    `<circle cx="32" cy="32" r="29" fill="#fff3e0" stroke="none"/>
     <ellipse cx="22" cy="30" rx="16" ry="15" fill="#ffd54f"/>
     <ellipse cx="22" cy="30" rx="5" ry="4.5" fill="#ffb300"/>
     <ellipse cx="43" cy="37" rx="16" ry="15" fill="#ffca28"/>
     <ellipse cx="43" cy="37" rx="5" ry="4.5" fill="#ffa000"/>
     <path d="M30 6 L32 12 M38 5 L37 11 M8 52 L13 49 M56 14 L51 18" stroke="#ff7043" stroke-width="2.5"/>`,
  ),
  T(
    'tambor',
    'Tambor',
    `<circle cx="32" cy="32" r="29" fill="#e8eaff" stroke="none"/>
     <path d="M14 6 L30 24 M50 6 L34 24" stroke="#8d6e63" stroke-width="4"/>
     <path d="M11 27 V48 Q32 59 53 48 V27" fill="#e53935"/>
     <path d="M11 33 L19 46 L27 35 L35 48 L43 35 L53 46" fill="none" stroke="#ffd54f" stroke-width="3"/>
     <ellipse cx="32" cy="27" rx="21" ry="7" fill="#fff3e0"/>`,
  ),
  T(
    'campana',
    'Campana',
    `<circle cx="32" cy="32" r="29" fill="#e0f7fa" stroke="none"/>
     <path d="M32 9 Q15 10 16 31 L11 47 H53 L48 31 Q49 10 32 9 Z" fill="#ffc107"/>
     <rect x="9" y="45" width="46" height="6" rx="3" fill="#ffa000"/>
     <circle cx="32" cy="55" r="5" fill="#8d6e63"/>
     <path d="M24 6 Q32 0 40 6 L32 10 Z" fill="#e53935"/>
     <path d="M22 22 Q22 16 27 14" fill="none" stroke="#ffffff" stroke-width="3"/>`,
  ),
  T(
    'violin',
    'Violín',
    `<circle cx="32" cy="32" r="29" fill="#fff0e6" stroke="none"/>
     <g transform="rotate(-30 32 34)">
       <rect x="30" y="2" width="4" height="22" fill="#3e2723"/>
       <path d="M32 20 Q21 20 21 28 Q26 33 21 37 Q19 50 32 52 Q45 50 43 37 Q38 33 43 28 Q43 20 32 20 Z" fill="#e67e22"/>
       <path d="M30 22 V48 M34 22 V48" stroke-width="1.2"/>
       <rect x="27" y="44" width="10" height="3" fill="#3e2723"/>
     </g>
     <path d="M8 50 L56 12" stroke="#8d6e63" stroke-width="2.5"/>`,
  ),
  T(
    'estrella',
    'Estrella de Belén',
    `<circle cx="32" cy="32" r="28" fill="#1f3a68"/>
     <path d="M32 6 L37 27 L58 32 L37 37 L32 58 L27 37 L6 32 L27 27 Z" fill="#ffd43b"/>
     <circle cx="14" cy="15" r="1.8" fill="#ffffff" stroke="none"/>
     <circle cx="50" cy="48" r="1.8" fill="#ffffff" stroke="none"/>
     <circle cx="49" cy="14" r="1.4" fill="#ffffff" stroke="none"/>`,
  ),
  T(
    'uvas',
    'Uvas',
    `<path d="M33 18 L36 6" stroke-width="3"/>
     <path d="M35 14 Q24 2 16 10 Q24 18 35 14 Z" fill="#52b788"/>
     <circle cx="20" cy="24" r="6.5" fill="#7b2cbf"/><circle cx="32" cy="23" r="6.5" fill="#7b2cbf"/>
     <circle cx="44" cy="24" r="6.5" fill="#7b2cbf"/><circle cx="26" cy="34" r="6.5" fill="#7b2cbf"/>
     <circle cx="38" cy="34" r="6.5" fill="#7b2cbf"/><circle cx="32" cy="45" r="6.5" fill="#7b2cbf"/>
     <circle cx="21" cy="44" r="5.5" fill="#7b2cbf"/><circle cx="43" cy="44" r="5.5" fill="#7b2cbf"/>
     <circle cx="32" cy="56" r="5.5" fill="#7b2cbf"/>`,
  ),
  T(
    'corona',
    'Corona',
    `<path d="M8 22 L20 34 L32 13 L44 34 L56 22 L52 48 H12 Z" fill="#f4c430"/>
     <rect x="11" y="47" width="42" height="9" rx="2" fill="#d9a400"/>
     <circle cx="8" cy="21" r="3.5" fill="#f4c430"/><circle cx="32" cy="12" r="3.5" fill="#f4c430"/>
     <circle cx="56" cy="21" r="3.5" fill="#f4c430"/>
     <circle cx="32" cy="38" r="4.5" fill="#d62828"/>
     <circle cx="19" cy="42" r="3" fill="#2a9d8f"/><circle cx="45" cy="42" r="3" fill="#2a9d8f"/>`,
  ),
  T(
    'arca',
    'Arca de Noé',
    `<path d="M16 33 V23 H48 V33" fill="#d9a066"/>
     <path d="M13 24 L32 13 L51 24 Z" fill="#9c4a23"/>
     <rect x="29" y="26" width="6" height="7" fill="#5b3a1a"/>
     <path d="M5 33 H59 L51 48 H13 Z" fill="#7d4b22"/>
     <path d="M3 55 Q10 50 17 55 T31 55 T45 55 T60 55" fill="none" stroke="#2f80ed" stroke-width="3"/>`,
  ),
  T(
    'lampara',
    'Lámpara de aceite',
    `<path d="M52 33 Q45 22 53 11 Q56 20 60 24 Q61 33 52 33 Z" fill="#ff9f1a"/>
     <path d="M53 31 Q50 25 54 19 Q57 25 56 31 Z" fill="#ffe066" stroke="none"/>
     <path d="M10 39 Q12 30 30 30 H43 L56 34 L50 40 Q48 48 30 48 Q12 48 10 39 Z" fill="#c0703a"/>
     <path d="M10 38 Q2 34 8 27" fill="none" stroke-width="3.5"/>
     <ellipse cx="30" cy="53" rx="12" ry="3.5" fill="#8a4b22"/>`,
  ),
  T(
    'zarza',
    'Zarza ardiente',
    `<path d="M14 36 Q9 22 20 12 Q20 22 26 24 Q24 12 32 3 Q36 16 40 22 Q42 14 46 10 Q55 22 50 36 Z" fill="#ff6b1a"/>
     <path d="M22 36 Q20 26 26 22 Q28 28 32 28 Q32 20 36 16 Q42 26 42 36 Z" fill="#ffd23f" stroke="none"/>
     <path d="M7 46 Q5 36 15 34 Q20 28 28 32 Q34 26 40 32 Q48 28 52 36 Q60 38 57 48 Q57 57 47 57 H17 Q7 57 7 46 Z" fill="#3f9b3a"/>`,
  ),
  T(
    'cruz',
    'Cruz',
    `<circle cx="32" cy="30" r="27" fill="#fff1b8" stroke="none"/>
     <path d="M27 5 H37 V19 H51 V29 H37 V55 H27 V29 H13 V19 H27 Z" fill="#a8693a"/>
     <path d="M8 60 Q32 49 56 60 Z" fill="#6aa84f"/>`,
    2,
  ),
  T(
    'biblia',
    'Biblia',
    `<path d="M5 18 L32 23 L59 18 L59 52 L32 57 L5 52 Z" fill="#6b2f17"/>
     <path d="M8 15 Q20 11 32 18 L32 51 Q20 45 8 48 Z" fill="#fff8e6"/>
     <path d="M56 15 Q44 11 32 18 L32 51 Q44 45 56 48 Z" fill="#fff8e6"/>
     <path d="M13 24 L27 27 M13 31 L27 34 M13 38 L27 41 M37 27 L51 24 M37 34 L51 31 M37 41 L51 38" stroke-width="1.6"/>
     <path d="M30 51 L30 62 L33 59 L36 62 L36 50" fill="#c0392b"/>`,
    2,
  ),
  T(
    'olivo',
    'Rama de olivo',
    `<path d="M8 57 Q30 40 56 7" fill="none" stroke="#6b4f2a" stroke-width="3.5"/>
     <ellipse cx="14" cy="42" rx="9" ry="4" transform="rotate(-70 14 42)" fill="#6a994e"/>
     <ellipse cx="25" cy="49" rx="9" ry="4" transform="rotate(-10 25 49)" fill="#6a994e"/>
     <ellipse cx="26" cy="29" rx="9" ry="4" transform="rotate(-70 26 29)" fill="#6a994e"/>
     <ellipse cx="38" cy="37" rx="9" ry="4" transform="rotate(-10 38 37)" fill="#6a994e"/>
     <ellipse cx="38" cy="16" rx="9" ry="4" transform="rotate(-70 38 16)" fill="#6a994e"/>
     <ellipse cx="49" cy="24" rx="9" ry="4" transform="rotate(-10 49 24)" fill="#6a994e"/>
     <circle cx="20" cy="35" r="4" fill="#3d405b"/><circle cx="34" cy="46" r="4" fill="#3d405b"/>
     <circle cx="44" cy="31" r="4" fill="#3d405b"/>`,
    2,
  ),
  T(
    'barca',
    'Barca',
    `<path d="M33 7 V40" stroke-width="2.5"/>
     <path d="M35 9 V40 H54 Z" fill="#fdfdfd"/>
     <path d="M31 14 V40 H14 Z" fill="#f5e6c8"/>
     <path d="M5 42 H59 L51 54 H13 Z" fill="#6d4c41"/>
     <path d="M3 59 Q10 55 17 59 T31 59 T45 59 T61 59" fill="none" stroke="#2f80ed" stroke-width="3"/>`,
    2,
  ),
  T(
    'agua',
    'Agua',
    `<path d="M32 5 Q51 30 51 40 A19 19 0 0 1 13 40 Q13 30 32 5 Z" fill="#1e88e5"/>
     <path d="M22 40 Q22 48 28 52" fill="none" stroke="#ffffff" stroke-width="3.5"/>`,
    2,
  ),
  T(
    'trigo',
    'Trigo',
    `<g>
       <path d="M32 58 V16" stroke-width="2.5"/>
       <ellipse cx="32" cy="11" rx="3.5" ry="5.5" fill="#e9b949"/>
       <ellipse cx="27.5" cy="18" rx="3.5" ry="5.5" fill="#e9b949"/><ellipse cx="36.5" cy="18" rx="3.5" ry="5.5" fill="#e9b949"/>
       <ellipse cx="27.5" cy="26" rx="3.5" ry="5.5" fill="#e9b949"/><ellipse cx="36.5" cy="26" rx="3.5" ry="5.5" fill="#e9b949"/>
       <ellipse cx="27.5" cy="34" rx="3.5" ry="5.5" fill="#e9b949"/><ellipse cx="36.5" cy="34" rx="3.5" ry="5.5" fill="#e9b949"/>
     </g>
     <g transform="rotate(-28 32 58)">
       <path d="M32 58 V20" stroke-width="2.5"/>
       <ellipse cx="32" cy="16" rx="3" ry="5" fill="#d9a63a"/>
       <ellipse cx="28" cy="23" rx="3" ry="5" fill="#d9a63a"/><ellipse cx="36" cy="23" rx="3" ry="5" fill="#d9a63a"/>
       <ellipse cx="28" cy="31" rx="3" ry="5" fill="#d9a63a"/><ellipse cx="36" cy="31" rx="3" ry="5" fill="#d9a63a"/>
     </g>
     <g transform="rotate(28 32 58)">
       <path d="M32 58 V20" stroke-width="2.5"/>
       <ellipse cx="32" cy="16" rx="3" ry="5" fill="#d9a63a"/>
       <ellipse cx="28" cy="23" rx="3" ry="5" fill="#d9a63a"/><ellipse cx="36" cy="23" rx="3" ry="5" fill="#d9a63a"/>
       <ellipse cx="28" cy="31" rx="3" ry="5" fill="#d9a63a"/><ellipse cx="36" cy="31" rx="3" ry="5" fill="#d9a63a"/>
     </g>
     <rect x="25" y="44" width="14" height="6" rx="2" fill="#b5651d"/>`,
    2,
  ),
];

export const FICHAS_POR_ID = new Map(FICHAS.map((f) => [f.id, f]));

export function svgFicha(id: string): string {
  const f = FICHAS_POR_ID.get(id);
  if (!f) return '';
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><g stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${f.svg}</g></svg>`;
}

/** Tipos disponibles en una vuelta del recorrido. */
export function poolDeVuelta(vuelta: number): string[] {
  return FICHAS.filter((f) => f.desdeVuelta <= vuelta).map((f) => f.id);
}
