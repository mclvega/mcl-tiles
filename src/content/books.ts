/** Los 66 libros de la Biblia (nombres de la Reina-Valera 1960). */
export const LIBROS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces', 'Rut',
  '1 Samuel', '2 Samuel', '1 Reyes', '2 Reyes', '1 Crónicas', '2 Crónicas', 'Esdras', 'Nehemías',
  'Ester', 'Job', 'Salmos', 'Proverbios', 'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías',
  'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Abdías', 'Jonás',
  'Miqueas', 'Nahúm', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías', 'Malaquías',
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos', '1 Corintios', '2 Corintios',
  'Gálatas', 'Efesios', 'Filipenses', 'Colosenses', '1 Tesalonicenses', '2 Tesalonicenses',
  '1 Timoteo', '2 Timoteo', 'Tito', 'Filemón', 'Hebreos', 'Santiago', '1 Pedro', '2 Pedro',
  '1 Juan', '2 Juan', '3 Juan', 'Judas', 'Apocalipsis',
] as const;

export const NIVELES_POR_LIBRO = 20;
export const NIVELES_POR_VUELTA = LIBROS.length * NIVELES_POR_LIBRO;

export interface Ubicacion {
  vuelta: number;
  /** Índice del libro (0..65). */
  libro: number;
  nombreLibro: string;
  /** Posición del nivel dentro del libro (1..20). */
  nivelEnLibro: number;
  /** Primer nivel del libro. */
  primerNivel: number;
}

/** Ubica un nivel en el recorrido infinito: vuelta → libro → nivel. */
export function ubicarNivel(n: number): Ubicacion {
  const i = n - 1;
  const vuelta = Math.floor(i / NIVELES_POR_VUELTA) + 1;
  const enVuelta = i % NIVELES_POR_VUELTA;
  const libro = Math.floor(enVuelta / NIVELES_POR_LIBRO);
  return {
    vuelta,
    libro,
    nombreLibro: LIBROS[libro],
    nivelEnLibro: (enVuelta % NIVELES_POR_LIBRO) + 1,
    primerNivel: n - (enVuelta % NIVELES_POR_LIBRO),
  };
}
