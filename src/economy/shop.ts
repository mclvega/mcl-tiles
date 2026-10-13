/** Catálogo de la tienda "El Alfolí". Todo se canjea con talentos, sin dinero real. */
export type IdAyuda = 'deshacer' | 'barajar' | 'lampara' | 'espacio';
export type Categoria = 'ayuda' | 'fondo' | 'estilo' | 'melodia' | 'tarjeta';

export interface InfoAyuda {
  id: IdAyuda;
  nombre: string;
  icono: string;
  descripcion: string;
  ref: string;
  precio: number;
}

export const AYUDAS: Record<IdAyuda, InfoAyuda> = {
  deshacer: {
    id: 'deshacer',
    nombre: 'Volver al camino',
    icono: '↩️',
    descripcion: 'Devuelve al tablero la última ficha que elegiste.',
    ref: 'Isaías 30:21',
    precio: 20,
  },
  barajar: {
    id: 'barajar',
    nombre: 'Viento recio',
    icono: '🌬️',
    descripcion: 'Mezcla las fichas del tablero (siempre queda con solución).',
    ref: 'Hechos 2:2',
    precio: 30,
  },
  lampara: {
    id: 'lampara',
    nombre: 'Lámpara',
    icono: '🪔',
    descripcion: 'Completa un trío por ti.',
    ref: 'Salmos 119:105',
    precio: 50,
  },
  espacio: {
    id: 'espacio',
    nombre: 'Ensancha tu tienda',
    icono: '⛺',
    descripcion: 'Agrega un espacio más a la bandeja en este nivel.',
    ref: 'Isaías 54:2',
    precio: 60,
  },
};

export const ORDEN_AYUDAS: IdAyuda[] = ['deshacer', 'barajar', 'lampara', 'espacio'];

export interface Articulo {
  id: string;
  categoria: Exclude<Categoria, 'ayuda'>;
  nombre: string;
  descripcion: string;
  precio: number;
}

export const ARTICULOS: Articulo[] = [
  { id: 'amanecer', categoria: 'fondo', nombre: 'Amanecer', descripcion: 'Luz suave de la mañana.', precio: 0 },
  { id: 'galilea', categoria: 'fondo', nombre: 'Mar de Galilea', descripcion: 'Aguas tranquilas y cielo azul.', precio: 150 },
  { id: 'olivos', categoria: 'fondo', nombre: 'Monte de los Olivos', descripcion: 'Colinas verdes y olivos.', precio: 200 },
  { id: 'trigal', categoria: 'fondo', nombre: 'Campo de trigo', descripcion: 'Mies dorada lista para la siega.', precio: 200 },
  { id: 'templo', categoria: 'fondo', nombre: 'Atrios del templo', descripcion: 'Piedra clara y arcos.', precio: 250 },
  { id: 'atardecer', categoria: 'fondo', nombre: 'Atardecer', descripcion: 'Cielo naranja y violeta.', precio: 300 },

  { id: 'marfil', categoria: 'estilo', nombre: 'Marfil', descripcion: 'Fichas claras y clásicas.', precio: 0 },
  { id: 'acacia', categoria: 'estilo', nombre: 'Madera de acacia', descripcion: 'Como el arca del pacto.', precio: 300 },
  { id: 'lino', categoria: 'estilo', nombre: 'Lino azul', descripcion: 'Tonos celestes y suaves.', precio: 300 },
  { id: 'oro', categoria: 'estilo', nombre: 'Oro del templo', descripcion: 'Fichas con borde dorado.', precio: 400 },

  { id: 'gracia', categoria: 'melodia', nombre: 'Sublime gracia', descripcion: 'Himno tradicional (dominio público).', precio: 0 },
  { id: 'doxologia', categoria: 'melodia', nombre: 'A Dios el Padre celestial', descripcion: 'Doxología, «Old Hundredth» (dominio público).', precio: 200 },
  { id: 'alegria', categoria: 'melodia', nombre: 'Himno a la alegría', descripcion: 'Melodía de Beethoven (dominio público).', precio: 200 },
  { id: 'nochePaz', categoria: 'melodia', nombre: 'Noche de paz', descripcion: 'Villancico de F. Gruber (dominio público).', precio: 200 },

  { id: 'sencilla', categoria: 'tarjeta', nombre: 'Sencilla', descripcion: 'Tarjeta clara para compartir versículos.', precio: 0 },
  { id: 'pergamino', categoria: 'tarjeta', nombre: 'Pergamino', descripcion: 'Papel antiguo con borde café.', precio: 100 },
  { id: 'olivo', categoria: 'tarjeta', nombre: 'Ramas de olivo', descripcion: 'Marco verde con hojas.', precio: 100 },
  { id: 'cielo', categoria: 'tarjeta', nombre: 'Cielo', descripcion: 'Azul profundo con estrellas.', precio: 100 },
];

export const ARTICULOS_POR_ID = new Map(ARTICULOS.map((a) => [a.id, a]));
export const GRATIS = ARTICULOS.filter((a) => a.precio === 0).map((a) => a.id);

export const NOMBRES_CATEGORIA: Record<Categoria, string> = {
  ayuda: 'Ayudas',
  fondo: 'Fondos',
  estilo: 'Estilos de ficha',
  melodia: 'Melodías',
  tarjeta: 'Tarjetas de versículo',
};
