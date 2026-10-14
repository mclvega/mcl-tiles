/**
 * Plantillas de figuras para la capa base del tablero.
 * Cada "#" es una ficha completa. Las capas superiores se derivan de la base.
 */
export interface Layout {
  id: string;
  nombre: string;
  filas: string[];
}

/** Máximo de columnas: con más, en un celular las fichas quedan demasiado chicas. */
export const MAX_COLUMNAS = 5;

const TODAS: Layout[] = [
  { id: 'cuadro3', nombre: 'Cuadro', filas: ['###', '###', '###'] },
  { id: 'rect4x3', nombre: 'Mesa', filas: ['####', '####', '####'] },
  { id: 'monte', nombre: 'Monte', filas: ['...#...', '..###..', '.#####.', '#######'] },
  { id: 'cruz', nombre: 'Cruz', filas: ['.##.', '####', '####', '.##.', '.##.', '.##.'] },
  { id: 'pan', nombre: 'Pan', filas: ['.####.', '######', '######', '.####.'] },
  { id: 'copa', nombre: 'Copa', filas: ['#######', '.#####.', '..###..', '...#...', '..###..'] },
  { id: 'rect4x4', nombre: 'Altar', filas: ['####', '####', '####', '####'] },
  { id: 'templo', nombre: 'Templo', filas: ['...#...', '..###..', '.#####.', '.#####.', '.#####.', '.#####.'] },
  { id: 'rombo', nombre: 'Piedra preciosa', filas: ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'] },
  { id: 'corazon', nombre: 'Corazón', filas: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'] },
  { id: 'arca', nombre: 'Arca', filas: ['..###..', '.#####.', '#######', '#######', '.#####.'] },
  { id: 'pez', nombre: 'Pez', filas: ['.###..#', '######.', '#######', '######.', '.###..#'] },
  { id: 'estrella', nombre: 'Estrella', filas: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'] },
  { id: 'corona', nombre: 'Corona', filas: ['#..#..#', '##.#.##', '#######', '#######', '#######'] },
  { id: 'tablas', nombre: 'Tablas de la ley', filas: ['.##.##.', '###.###', '###.###', '###.###', '###.###'] },
  { id: 'rect5x4', nombre: 'Mesa grande', filas: ['#####', '#####', '#####', '#####'] },
  { id: 'rect5x5', nombre: 'Plaza', filas: ['#####', '#####', '#####', '#####', '#####'] },
  { id: 'cruzGrande', nombre: 'Cruz grande', filas: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'] },
  { id: 'corazonGrande', nombre: 'Corazón grande', filas: ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'] },
  { id: 'temploGrande', nombre: 'Templo grande', filas: ['...#...', '..###..', '.#####.', '#######', '#######', '#######', '#######'] },
  { id: 'arcaGrande', nombre: 'Arca grande', filas: ['...##...', '..####..', '.######.', '########', '########', '.######.'] },
  { id: 'rect6x5', nombre: 'Atrio', filas: ['######', '######', '######', '######', '######'] },
  { id: 'rect6x6', nombre: 'Tabernáculo', filas: ['######', '######', '######', '######', '######', '######'] },
  { id: 'rect7x6', nombre: 'Muralla', filas: ['#######', '#######', '#######', '#######', '#######', '#######'] },
  { id: 'arcaMayor', nombre: 'Arca del pacto', filas: ['...##...', '..####..', '.######.', '########', '########', '########', '.######.'] },
  { id: 'rect8x7', nombre: 'Muros de Jerusalén', filas: ['########', '########', '########', '########', '########', '########', '########'] },
  { id: 'monte5', nombre: 'Monte', filas: ['..#..', '.###.', '#####', '#####'] },
  { id: 'corazon5', nombre: 'Corazón', filas: ['##.##', '#####', '#####', '.###.', '..#..'] },
  { id: 'rombo5', nombre: 'Piedra preciosa', filas: ['..#..', '.###.', '#####', '.###.', '..#..'] },
  { id: 'cruz5', nombre: 'Cruz', filas: ['.###.', '#####', '#####', '.###.', '.###.'] },
  { id: 'copa5', nombre: 'Copa', filas: ['#####', '.###.', '..#..', '.###.'] },
  { id: 'arca5', nombre: 'Arca', filas: ['.###.', '#####', '#####', '.###.'] },
  { id: 'templo5', nombre: 'Templo', filas: ['..#..', '.###.', '#####', '#####', '#####', '#####'] },
  { id: 'corona5', nombre: 'Corona', filas: ['#.#.#', '#####', '#####', '#####'] },
  { id: 'tablas5', nombre: 'Tablas de la ley', filas: ['##.##', '##.##', '##.##', '##.##'] },
  { id: 'rect5x6', nombre: 'Atrio', filas: ['#####', '#####', '#####', '#####', '#####', '#####'] },
  { id: 'rect5x7', nombre: 'Muralla', filas: ['#####', '#####', '#####', '#####', '#####', '#####', '#####'] },
  { id: 'arca5Mayor', nombre: 'Arca del pacto', filas: ['.###.', '#####', '#####', '#####', '#####', '#####', '.###.'] },
];

export const LAYOUTS: Layout[] = TODAS.filter((l) => Math.max(...l.filas.map((f) => f.length)) <= MAX_COLUMNAS);

/** Celdas de la capa base en medias unidades (cada ficha ocupa 2x2). */
export function baseCells(layout: Layout): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  layout.filas.forEach((fila, r) => {
    [...fila].forEach((ch, c) => {
      if (ch === '#') cells.push([c * 2, r * 2]);
    });
  });
  return cells;
}
