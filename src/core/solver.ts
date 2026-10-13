/**
 * Buscador de solución con poda. Se usa para verificar que un tablero
 * barajado sigue teniendo solución y en las pruebas automáticas.
 */
export interface EstadoSolver {
  tipos: string[];
  cubiertaPor: number[][];
  cubre: number[][];
  enTablero: boolean[];
  bandeja: string[];
  capacidad: number;
}

export function resolver(estado: EstadoSolver, limiteNodos = 20000): number[] | null {
  const n = estado.tipos.length;
  const enTablero = [...estado.enTablero];
  const tapas = estado.cubiertaPor.map((l) => l.filter((j) => enTablero[j]).length);
  const bandeja = new Map<string, number>();
  for (const t of estado.bandeja) bandeja.set(t, (bandeja.get(t) ?? 0) + 1);
  let ocupacion = estado.bandeja.length;
  let restantes = enTablero.filter(Boolean).length;
  const camino: number[] = [];
  const vistos = new Set<string>();
  let nodos = 0;

  const claveEstado = () => {
    let s = '';
    for (let i = 0; i < n; i++) s += enTablero[i] ? '1' : '0';
    return s + '|' + [...bandeja.entries()].filter(([, c]) => c > 0).sort().map(([t, c]) => t + c).join(',');
  };

  const buscar = (): boolean => {
    if (restantes === 0) return ocupacion === 0;
    if (++nodos > limiteNodos) return false;
    const k = claveEstado();
    if (vistos.has(k)) return false;
    vistos.add(k);

    const libresPorTipo = new Map<string, number[]>();
    for (let i = 0; i < n; i++) {
      if (enTablero[i] && tapas[i] === 0) {
        const l = libresPorTipo.get(estado.tipos[i]) ?? [];
        l.push(i);
        libresPorTipo.set(estado.tipos[i], l);
      }
    }
    const candidatos: Array<{ id: number; puntos: number }> = [];
    for (const [tipo, ids] of libresPorTipo) {
      const enBandeja = bandeja.get(tipo) ?? 0;
      const completa = enBandeja === 2;
      if (!completa && ocupacion + 1 >= estado.capacidad) continue;
      const base = completa ? 1000 : enBandeja * 100 + Math.min(ids.length, 3) * 30;
      ids
        .sort((a, b) => estado.cubre[b].length - estado.cubre[a].length)
        .slice(0, 2)
        .forEach((id) => candidatos.push({ id, puntos: base + estado.cubre[id].length }));
    }
    candidatos.sort((a, b) => b.puntos - a.puntos);

    for (const { id } of candidatos) {
      const tipo = estado.tipos[id];
      const antes = bandeja.get(tipo) ?? 0;
      enTablero[id] = false;
      restantes--;
      for (const d of estado.cubre[id]) tapas[d]--;
      if (antes === 2) {
        bandeja.set(tipo, 0);
        ocupacion -= 2;
      } else {
        bandeja.set(tipo, antes + 1);
        ocupacion++;
      }
      camino.push(id);
      if (buscar()) return true;
      camino.pop();
      if (antes === 2) {
        bandeja.set(tipo, 2);
        ocupacion += 2;
      } else {
        bandeja.set(tipo, antes);
        ocupacion--;
      }
      for (const d of estado.cubre[id]) tapas[d]++;
      restantes++;
      enTablero[id] = true;
    }
    return false;
  };

  return buscar() ? camino : null;
}
