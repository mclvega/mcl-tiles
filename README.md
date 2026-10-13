# McL Tiles

Juego de fichas para el navegador. Se juntan tres fichas iguales y, al completar cada nivel, el juego regala un versículo de la Biblia Reina-Valera 1960. Está pensado para **adultos de 60 años o más**: es fácil, tranquilo y no tiene fin.

- **Niveles infinitos:** se generan solos a partir del número de nivel y siempre tienen solución.
- **Recorrido por la Biblia:** cada 20 niveles se avanza un libro, de Génesis a Apocalipsis. Al terminar empieza una nueva vuelta con fichas nuevas.
- **Fichas coloridas:** animalitos (cordero, paloma, león, camello, burrito, ranita, abejita…), instrumentos de alabanza (arpa, shofar, pandero, guitarra, flauta, címbalos, tambor, campana, violín) y símbolos bíblicos. Son SVG propios, sin imágenes de personas.
- **Biblia local:** 200 versículos RVR1960 incluidos en el juego. Se leen sin conexión y sin depender de otras páginas.
- **Preguntas bíblicas fáciles** con 3 opciones. Se usan en el cofre de bendiciones (cada 3 niveles), en la pregunta del día y en la segunda oportunidad. Equivocarse nunca castiga.
- **Tienda "El Alfolí":** las monedas ganadas se canjean por ayudas, fondos, estilos de ficha, melodías y tarjetas de versículo. No se usa dinero real.
- **Pide el nombre del jugador** y lo usa en los saludos. Solo se guarda en el navegador.
- **Menú de Configuración:**
  - Dificultad (Muy fácil, Fácil, Normal y Desafío).
  - Gráficos: calidad y límite de FPS.
  - Sonido: volúmenes y melodía.
  - Pantalla: tamaño de texto, alto contraste, tema y cursor grande.
  - Lectura en voz alta, **desactivada por defecto**.
  - Exportar e importar el progreso.
- **Música tranquila** sintetizada en el navegador a partir de himnos de dominio público. No hay archivos de audio.

## Requisitos

- Node.js 22 o más reciente.

## Uso

```bash
npm install
npm run dev       # servidor de desarrollo en http://localhost:5173
npm test          # pruebas automáticas (Vitest)
npm run build     # compila a dist/
npm run preview   # sirve el build en http://localhost:4173
```

En VS Code, el panel **Ejecutar y depurar** (`.vscode/launch.json`) tiene estas configuraciones:

| Configuración | Qué hace |
|---|---|
| **McL Tiles: jugar en local (Chrome / Edge)** | Levanta `npm run dev` y abre el juego con el depurador conectado |
| **McL Tiles: probar build de producción (Chrome)** | Compila, sirve el build y lo abre |
| **McL Tiles: pruebas (Vitest)** | Ejecuta las pruebas |

## Publicar en Netlify

El repositorio ya trae `netlify.toml`, que define el build (`npm run build`), la carpeta de salida (`dist`), Node 22, cabeceras de seguridad (CSP) y caché.

1. Sube el repositorio a GitHub.
2. En Netlify elige **Add new site → Import an existing project** y selecciona el repositorio. La configuración se toma sola.

También se puede publicar desde la terminal con `npx netlify deploy --prod`.

## Estructura

```
src/
├─ core/        # lógica pura: rng con semilla, figuras, dificultad, generador, solver y partida
├─ content/     # fichas (SVG), libros, versículos, preguntas y melodías
├─ data/        # versiculos.json (RVR1960) y preguntas.json
├─ economy/     # monedas, tienda y premios
├─ settings/    # configuración y su validación
├─ fx/          # efectos en canvas (destellos, confeti, palomas) con límite de FPS
├─ ui/          # pantallas: bienvenida, inicio, juego, biblia, recorrido, alfolí, versículos, configuración y acerca
├─ audio.ts     # música y efectos con Web Audio
├─ speech.ts    # lectura en voz alta (Web Speech API)
└─ storage.ts   # guardado local versionado, exportar e importar
tests/          # generador (10 000 niveles resolubles), contenido, guardado y economía
```

### Cómo se garantiza que cada nivel tenga solución

1. Se arma la figura del tablero por capas.
2. Se simula una partida quitando siempre una ficha libre al azar, lo que da un orden de retirada válido.
3. Los tipos de ficha se asignan en tríos siguiendo ese orden, de modo que la bandeja nunca supera su límite.

Las pruebas juegan esa solución en los niveles 1 a 10 000.

## Contenido y derechos

- **Texto bíblico:** Reina-Valera 1960® © Sociedades Bíblicas en América Latina, 1960. Renovado © Sociedades Bíblicas Unidas, 1988. Utilizado con permiso. El juego incluye una selección de versículos, no la Biblia completa: distribuir el texto completo de la RVR1960 requiere licencia de las Sociedades Bíblicas Unidas. Antes de publicar conviene confirmar su política de citas y cotejar los textos con una edición oficial.
- **Música:** arreglos propios de melodías de dominio público (Sublime gracia, Old Hundredth, Himno a la alegría y Noche de paz).
- **Fuente:** Atkinson Hyperlegible (SIL Open Font License), incluida mediante `@fontsource`.
- **Privacidad:** no hay servidor. El nombre y el progreso quedan en el `localStorage` del navegador.
