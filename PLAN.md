# Plan: juego de fichas de navegador con temática evangélica (RVR1960)

Nombre de trabajo: **"Fichas de Fe"**. Alternativas: "Arca de Fichas" o "Tesoros del Reino".

---

## 1. Análisis del juego de referencia

**Tile Home - Match Puzzle Game** (`com.tile.home.match.puzzle.game`), de Panda Daily Puzzles.

| Dato | Valor |
|---|---|
| Descargas | más de 10 M |
| Reseñas | unas 494 mil |
| Clasificación | Apto para todos |
| Última actualización | 10 oct 2026 |
| Género | Puzle de "unir 3" con fichas (triple tile match) |

**Bucle principal del género:**
1. El tablero tiene fichas apiladas en varias capas. Solo se puede tocar una ficha si ninguna otra la cubre.
2. Al tocar una ficha, esta pasa a una **bandeja de 7 espacios**.
3. Tres fichas iguales en la bandeja desaparecen.
4. Se gana al vaciar el tablero y se pierde si la bandeja se llena.
5. Hay ayudas (*boosters*): deshacer, barajar, pista o imán, y un espacio extra.
6. Ofrece "miles de niveles" con disposiciones distintas, funciona sin wifi y es para todas las edades.

**Qué dicen las reseñas:**
- Gusta el componente de estrategia y que relaja.
- Hay quejas de que, tras una actualización, **los colores y dibujos no se distinguen bien por falta de contraste**. Es una lección directa: las fichas deben leerse con claridad.
- Piden premios más altos y más dificultad.
- La monetización es con anuncios y compras.

**Qué copiamos y qué cambiamos:**

| Copiamos | Cambiamos |
|---|---|
| La mecánica de bandeja de 7 y unir 3 | Sin vidas ni esperas: se reintenta gratis |
| Las capas y las figuras en el tablero | Sin anuncios intrusivos ni compras |
| Los boosters | Niveles **infinitos** generados por algoritmo |
| Las animaciones satisfactorias | Un **versículo RVR1960** al terminar cada nivel |
| Que funcione sin conexión | Se pide y usa el **nombre del jugador** |

---

## 2. Requisitos confirmados

1. Es un juego de navegador publicado en **Netlify**, sin backend.
2. La temática es la iglesia evangélica y la Biblia **Reina-Valera 1960**.
3. **Cada nivel recomienda un versículo.**
4. **El juego es infinito.** No hay último nivel.
5. **Pide el nombre del usuario** y personaliza la experiencia con él.
6. **Recompensas canjeables con preguntas bíblicas fáciles** (trivia, ver §6b).
7. **El público son adultos de 60 años o más.** El juego debe ser **fácil, claro e interactivo** (ver §6c). Este requisito manda sobre los demás: cualquier decisión de diseño se prioriza por facilidad de uso.

---

## 3. Mecánica de juego

- **Solo se juega con toques.** No hay arrastres, gestos de deslizar ni doble toque. Nunca hay temporizador ni presión de tiempo.
- **Tablero:** fichas en una rejilla con medias posiciones (offset de 0,5), como en Mahjong. Hay **de 1 a 4 capas como máximo**. Las fichas bloqueadas se ven atenuadas y las libres tienen un borde claro, de modo que se distingue a simple vista qué se puede tocar.
- **Fichas grandes:** miden como mínimo **64 px en móvil** y el tablero se escala para ocupar la pantalla.
- **Ficha libre:** una ficha es libre si ninguna ficha de una capa superior se superpone con ella.
- **Bandeja:** tiene 7 espacios. En los modos de dificultad "Muy fácil" y "Fácil" tiene 8 (ver §6d). Las fichas iguales se agrupan juntas y al formar 3 se eliminan con una animación lenta y vistosa.
- **Ayuda automática:** si el jugador pasa 15 segundos sin tocar nada, se ilumina suavemente un trío posible. Se puede desactivar en Configuración.
- **Aviso preventivo:** cuando a la bandeja le quedan 2 espacios, aparece el mensaje "¡Cuidado, la bandeja casi está llena!" y los espacios libres se marcan en ámbar.
- **Derrota amable:** la bandeja está llena y no hay trío. No aparece la palabra "Perdiste", sino "¡Casi lo logras, Ana!". Se ofrece primero una **segunda oportunidad gratis**: responder una pregunta bíblica fácil (§6b) devuelve 3 fichas al tablero. Si no, se puede "Intentar de nuevo".
- **Victoria:** el tablero queda vacío. Se otorgan de 1 a 3 estrellas según las ayudas usadas, nunca por tiempo. Se muestra la pantalla con el versículo.

**Boosters con nombre temático.** Se compran con "talentos", la moneda del juego, en referencia a Mateo 25:

| Booster | Nombre | Efecto |
|---|---|---|
| Deshacer | "Volver al camino" | Devuelve la última ficha al tablero |
| Barajar | "Viento recio" (Hch 2:2) | Reordena las fichas del tablero |
| Pista | "Lámpara" (Sal 119:105) | Resalta 3 fichas iguales disponibles |
| Espacio extra | "Ensancha tu tienda" (Is 54:2) | Añade un octavo espacio a la bandeja durante el nivel |

---

## 4. Juego infinito: generación procedural

### 4.1 Semilla determinista
- `seed = hash("fichas-de-fe" + numeroNivel)` usando un PRNG como **mulberry32**.
- El nivel N siempre es el mismo para todos los jugadores, así que se puede compartir ("¿pasaste el nivel 214?").
- No se guarda ningún nivel. Se genera al vuelo en milisegundos.

### 4.2 Niveles que siempre tienen solución
La solución se garantiza por construcción:
1. Se genera la **geometría**: posiciones y capas tomadas de una plantilla de figura.
2. Se **simula una partida**: se elige al azar una ficha libre, se "retira", y se repite hasta vaciar el tablero. Eso da un **orden de retirada válido**.
3. Los **tipos** se asignan en tríos siguiendo ese orden. Para la dificultad se mezclan tríos dentro de una ventana `W`, de modo que la bandeja nunca necesite más de `7 - margen` fichas.
4. Una verificación rápida (solver greedy con límite) descarta los casos raros y regenera con `seed+1`.

### 4.3 Curva de dificultad infinita y suave (público de 60+)
Los parámetros dependen de `n` y suben **lentamente** hasta un **techo bajo**. Después varían dentro de un rango, para que el juego nunca se vuelva frustrante ni monótono. La tabla corresponde a la dificultad **"Normal"**. El ajuste de dificultad de §6d multiplica estos valores.

| Parámetro | Niveles 1–3 (tutorial) | Nivel ~50 | Nivel 100 en adelante (techo con variación) |
|---|---|---|---|
| Total de fichas (múltiplo de 3) | 9–18 | 36–45 | 45–75 |
| Tipos distintos | 3–4 | 6–7 | 7–10 |
| Capas | 1 | 2–3 | 2–4 |
| Ventana de mezcla `W` | 1 | 2 | 2–3 |
| Margen libre de la bandeja | 4 | 3 | 2 o más |
| Fichas especiales | — | — | solo "candado", y únicamente en "Desafío" |

- **Tutorial guiado** en los niveles 1 a 3. Una mano animada indica qué tocar y un texto grande explica cada paso, por ejemplo "Toca una paloma… ¡Ahora otra!". También se puede escuchar en voz alta (§6c).
- **Ritmo en dientes de sierra suave:** cada 5 niveles hay uno "de descanso" muy fácil. Cada 10 hay un **"Nivel especial"** con premio doble, que es un poco más largo pero no más difícil.
- **Ajuste automático (opcional):** si el jugador falla el mismo nivel 2 veces, se ofrece "¿Quieres que este nivel sea más fácil?", que regenera el nivel con menos tipos.
- **Figuras del tablero:** se elige una plantilla por semilla. Opciones: cruz vacía, arca, paloma, pez (ichthys), tablas de la ley, corona, corazón, lámpara, templo, estrella, monte y pan.

### 4.4 Estructura sin fin: recorrido por los 66 libros
- Cada **"capítulo" agrupa 20 niveles** y lleva el nombre de un libro: Génesis (1–20), Éxodo (21–40)… Apocalipsis (1301–1320).
- Al terminar Apocalipsis empieza la **"Segunda vuelta"**, después la tercera, y así sucesivamente, con un pequeño aumento de dificultad base y fichas especiales nuevas.
- En el mapa de progreso se ve "Libro 12 · 2Reyes · Vuelta 1".

---

## 5. Contenido temático

### 5.1 Fichas
Los íconos son **SVG propios** con un estilo coherente: contorno grueso, color plano y fondo de ficha claro. Cada tipo se distingue **por forma y por color**, para mantener el contraste y la accesibilidad.

**Lote inicial de 24:** Biblia abierta, cruz vacía, paloma, arca de Noé, tablas de la ley, copa de la Santa Cena, pan, pez, cordero, lámpara de aceite, arpa de David, honda y piedras, zarza ardiente, shofar (trompeta), pandero, estrella de Belén, corona, vid y uvas, espigas de trigo, tumba vacía, himnario, guitarra de alabanza, púlpito y templo.

**Lote ampliado, que se desbloquea en vueltas posteriores:** maná, vasija de barro, túnica de colores, columna de fuego, muros de Jericó, león de Judá, alfolí (canasta de ofrenda), manto, rama de olivo y aguas bautismales.

> Sensibilidad doctrinal: **no** se usan imágenes de Jesús, de santos, de la virgen, rosarios ni crucifijos con cuerpo. Se usa la **cruz vacía** y los símbolos bíblicos, en línea con la tradición evangélica.

### 5.2 Versículo recomendado por nivel (RVR1960)

**Formato del dataset** (`src/data/versiculos.json`):
```json
{ "id": 1, "ref": "Salmos 119:105",
  "texto": "Lámpara es a mis pies tu palabra, Y lumbrera a mi camino.",
  "tags": ["lampara", "biblia", "guia"], "libro": "Salmos" }
```

**Cómo se elige el versículo de cada nivel:**
1. Cada nivel tiene una **ficha protagonista**, la que más aparece. Se busca un versículo con ese `tag`. Por ejemplo, un nivel con muchas arcas recomienda Génesis 6–9 y uno con palomas recomienda Mateo 3:16.
2. Si no hay coincidencia, se busca uno del **libro del capítulo actual**.
3. Si tampoco lo hay, se usa una **permutación determinista** del pool completo por vuelta, para no repetir el mismo versículo hasta agotar el pool.

Con eso el juego es infinito pero el pool es finito: el pool se recicla barajado en cada vuelta.

**Pantalla de victoria:**
> **¡Bien hecho, Ana!** ⭐⭐⭐
> *"Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas."*
> — Josué 1:9 (RVR1960)
> [Copiar] [Compartir] [Leer el capítulo ↗] [Siguiente nivel]

- "Compartir" usa la Web Share API y, si no está disponible, copia al portapapeles.
- "Leer el capítulo" abre el pasaje en un lector externo, como Bible Gateway con `version=RVR1960`.
- Hay una sección **"Mis versículos"** que guarda los versículos recibidos y permite marcar favoritos.

**Ejemplos para el arranque.** Todo el texto se debe **cotejar contra una fuente oficial** antes de publicar:

| Ficha / tag | Referencia | Texto RVR1960 |
|---|---|---|
| biblia | Salmos 119:105 | Lámpara es a mis pies tu palabra, Y lumbrera a mi camino. |
| cruz | Juan 3:16 | Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna. |
| cordero | Salmos 23:1 | Jehová es mi pastor; nada me faltará. |
| corona | Filipenses 4:13 | Todo lo puedo en Cristo que me fortalece. |
| templo | Mateo 6:33 | Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas. |
| paloma | Isaías 40:31 | pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán. |
| general | Proverbios 3:5 | Fíate de Jehová de todo tu corazón, Y no te apoyes en tu propia prudencia. |
| general | Romanos 8:28 | Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados. |

**Meta del pool:** unos 365 versículos curados. Sirven además como **"Versículo del día"** en la pantalla de inicio.

### 5.3 Derechos de la RVR1960 ⚠️
- La RVR1960 **tiene copyright**. Reina-Valera 1960® es marca registrada de Sociedades Bíblicas Unidas y se usa bajo licencia.
- En "Acerca de" y al pie de la pantalla de versículos se debe incluir este crédito:
  *Texto bíblico: Reina-Valera 1960® © Sociedades Bíblicas en América Latina, 1960. Renovado © Sociedades Bíblicas Unidas, 1988. Utilizado con permiso.*
- Es habitual permitir citas limitadas sin permiso escrito, pero **no pude confirmar la cifra exacta**. Antes de publicar hay que revisar la política vigente de SBU (rvr60.bible / unitedbiblesocieties.org) y mantener el pool por debajo del límite que indiquen. Lo mismo aplica si el juego llegara a monetizarse.

---

## 6. Nombre del jugador

- **Primer inicio:** se muestra una pantalla de bienvenida con "¡Bienvenido! ¿Cómo te llamas?", un campo de texto y el botón "Comenzar".
  - Se aceptan de 1 a 20 caracteres. Se recortan los espacios y se aceptan letras con tildes y ñ.
  - El nombre siempre se inserta con `textContent`, nunca con `innerHTML`, para evitar inyección de código.
  - Se ofrece la opción "Jugar como invitado", que usa el nombre "Hermano(a)".
- **Uso del nombre:**
  - Saludo en el inicio: "Dios te bendiga, Ana".
  - Pantalla de victoria: "¡Bien hecho, Ana!".
  - Al compartir: "Ana completó el nivel 37 de Fichas de Fe".
  - Bendición de bienvenida (Números 6:24): *"Jehová te bendiga, y te guarde"*.
- **Privacidad:** el nombre se guarda **solo en el dispositivo** (`localStorage`) y se explica así en "Acerca de". Se puede cambiar desde Ajustes.

---

## 7. Arquitectura técnica

**Stack:** **Vite + TypeScript**, sin framework.
- El tablero se renderiza con DOM y CSS transforms, que alcanza de sobra para 150 fichas y facilita la accesibilidad y la nitidez en cualquier pantalla.
- Las animaciones usan la Web Animations API.
- El sonido usa la Web Audio API: un clic suave, el trío completado y la victoria. Se pueden agregar loops de alabanza instrumental con licencia libre.
- Es una **PWA**: tiene manifest y service worker (`vite-plugin-pwa`), así que funciona sin conexión, igual que la app de referencia, y se puede instalar en el celular.
- La partida se guarda en `localStorage` con un esquema versionado: nombre, nivel actual, estrellas, talentos, boosters, versículos recibidos, favoritos y ajustes.

```
/
├─ index.html
├─ netlify.toml
├─ public/            # íconos PWA, og-image, sonidos
├─ src/
│  ├─ main.ts         # arranque y router de pantallas
│  ├─ core/
│  │  ├─ rng.ts            # mulberry32 + hash de semilla
│  │  ├─ layouts.ts        # plantillas de figuras
│  │  ├─ generator.ts      # geometría + orden de retirada + asignación de tipos
│  │  ├─ difficulty.ts     # parámetros según n (curva con techo)
│  │  ├─ solver.ts         # verificación de solución
│  │  └─ game.ts           # estado: tablero, bandeja, tríos, victoria/derrota
│  ├─ content/
│  │  ├─ tiles.ts          # catálogo de fichas (id, svg, tags)
│  │  ├─ books.ts          # 66 libros → capítulos de 20 niveles
│  │  └─ verses.ts         # selección de versículo por nivel
│  ├─ data/versiculos.json
│  ├─ ui/              # pantallas: bienvenida(nombre), inicio, mapa, juego, victoria, derrota, mis-versículos, ajustes, acerca
│  ├─ storage.ts
│  ├─ audio.ts
│  └─ styles/
└─ tests/             # Vitest: generator siempre resoluble, determinismo, selección de versículos
```

**Netlify** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```
Se despliega conectando el repositorio de GitHub a Netlify (despliegue continuo) o con `netlify deploy --prod`.

---

## 8. Fases de desarrollo

| Fase | Entregable | Estimación |
|---|---|---|
| **0. Setup** | Vite + TS, ESLint y Vitest, primer despliegue "hola mundo" en Netlify | 0,5 día |
| **1. Núcleo jugable** | Tablero con capas, fichas libres, bandeja de 7, tríos, victoria y derrota, con 1 nivel fijo | 2 días |
| **2. Generador infinito** | Semilla, plantillas, orden de retirada, curva de dificultad, solver y tests de 10 000 niveles resolubles | 2–3 días |
| **3. Contenido** | 24 SVG de fichas, 66 libros y capítulos, primer pool de ~150 versículos verificados | 3 días |
| **4. Pantallas y flujo** | Bienvenida con nombre, inicio, mapa, victoria con versículo, Mis versículos, ajustes, Acerca y créditos | 2 días |
| **5. Boosters y economía** | Talentos, 4 boosters, estrellas y niveles difíciles | 1–2 días |
| **6. Pulido** | Animaciones, sonido, contraste y accesibilidad, PWA sin conexión, imagen para compartir | 2 días |
| **7. Lanzamiento** | Revisión de derechos RVR1960, Lighthouse > 90, dominio y metadatos OG en Netlify | 0,5 día |

**MVP mínimo para probar** (fases 0–2 más una versión básica de la 4): unos 5 días.

---

## 9. Criterios de aceptación

- [ ] Todos los niveles del 1 al 10 000 se generan en menos de 50 ms y son resolubles (test automatizado).
- [ ] El mismo número de nivel produce siempre el mismo tablero.
- [ ] Cada victoria muestra un versículo RVR1960 con su referencia, y no se repite dentro de la misma vuelta del pool.
- [ ] El primer inicio pide el nombre, el nombre aparece en el saludo y en la victoria, y se puede editar en Ajustes.
- [ ] El juego funciona sin conexión después de la primera visita.
- [ ] Se juega bien en un móvil de 360 px de ancho y en escritorio.
- [ ] El crédito de copyright de la RVR1960 se ve en Acerca y en la pantalla de versículos.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Derechos de la RVR1960 | Limitar el pool, incluir el aviso y confirmar la política de SBU antes de publicar |
| Errores de transcripción en versículos | Cotejar cada versículo contra una fuente oficial y agregar un test que valide el formato de las referencias |
| Fichas poco distinguibles (la queja de las reseñas) | Diferenciar por forma y por color, probar con simulador de daltonismo y ofrecer un modo de alto contraste |
| Monotonía en niveles altos | Plantillas variadas, fichas especiales por vuelta y ritmo en dientes de sierra |
