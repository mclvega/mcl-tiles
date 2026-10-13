# Plan: juego de fichas de navegador con temática evangélica (RVR1960)

Nombre del proyecto: **McL Tiles**.

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

1. Es un **juego de navegador** publicado en **Netlify**, sin backend. Se abre desde un enlace y no se instala. Se diseña primero para escritorio con mouse y también funciona en el navegador de tablet y celular.
2. La temática es la iglesia evangélica y la Biblia **Reina-Valera 1960**.
3. **Cada nivel recomienda un versículo.**
4. **El juego es infinito.** No hay último nivel.
5. **Pide el nombre del usuario** y personaliza la experiencia con él.
6. **Recompensas canjeables con preguntas bíblicas fáciles** (trivia, ver §6b).
7. **El público son adultos de 60 años o más.** El juego debe ser **fácil, claro e interactivo** (ver §6c). Este requisito manda sobre los demás: cualquier decisión de diseño se prioriza por facilidad de uso.

---

## 3. Mecánica de juego

- **Se juega con un solo clic** (mouse en la computadora o toque en el navegador del celular). No hay arrastres, doble clic ni atajos obligatorios. Al pasar el mouse, la ficha libre se resalta. Nunca hay temporizador ni presión de tiempo.
- **Tablero:** fichas en una rejilla con medias posiciones (offset de 0,5), como en Mahjong. Hay **de 1 a 4 capas como máximo**. Las fichas bloqueadas se ven atenuadas y las libres tienen un borde claro, de modo que se distingue a simple vista qué se puede elegir.
- **Fichas grandes:** miden como mínimo **64 px** (unos 80–96 px en una pantalla de computadora) y el tablero se escala para ocupar la ventana del navegador.
- **Ficha libre:** una ficha es libre si ninguna ficha de una capa superior se superpone con ella.
- **Bandeja:** tiene 7 espacios. En los modos de dificultad "Muy fácil" y "Fácil" tiene 8 (ver §6d). Las fichas iguales se agrupan juntas y al formar 3 se eliminan con una animación lenta y vistosa.
- **Ayuda automática:** si el jugador pasa 15 segundos sin elegir ninguna ficha, se ilumina suavemente un trío posible. Se puede desactivar en Configuración.
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

- **Tutorial guiado** en los niveles 1 a 3. Un puntero animado indica qué ficha elegir y un texto grande explica cada paso, por ejemplo "Haz clic en una paloma… ¡Ahora en otra!". También se puede escuchar en voz alta (§6c).
- **Ritmo en dientes de sierra suave:** cada 5 niveles hay uno "de descanso" muy fácil. Cada 10 hay un **"Nivel especial"** con premio doble, que es un poco más largo pero no más difícil.
- **Ajuste automático (opcional):** si el jugador falla el mismo nivel 2 veces, se ofrece "¿Quieres que este nivel sea más fácil?", que regenera el nivel con menos tipos.
- **Figuras del tablero:** se elige una plantilla por semilla. Opciones: cruz vacía, arca, paloma, pez (ichthys), tablas de la ley, corona, corazón, lámpara, templo, estrella, monte y pan.

### 4.4 Estructura sin fin: recorrido por los 66 libros
- Cada **"capítulo" agrupa 20 niveles** y lleva el nombre de un libro: Génesis (1–20), Éxodo (21–40)… Apocalipsis (1301–1320).
- Al terminar Apocalipsis empieza la **"Segunda vuelta"**, después la tercera, y así sucesivamente, con nuevas fichas temáticas y fondos. La dificultad no aumenta, porque se mantiene el techo amable de §4.3.
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
> [🔊 Escuchar] [Copiar] [Compartir] [Leer el capítulo ↗] [▶ Siguiente nivel]

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
- **Privacidad:** el nombre se guarda **solo en el dispositivo** (`localStorage`) y se explica así en "Acerca de". Se puede cambiar desde Configuración.

---

## 6b. Preguntas bíblicas y recompensas canjeables

### Cuándo aparece una pregunta
| Momento | Recompensa |
|---|---|
| **Cofre de bendiciones**, cada 3 niveles ganados | Si acierta, 30 talentos y un booster al azar |
| **Pregunta del día**, en la pantalla de inicio, una vez al día | 50 talentos y la racha diaria |
| **Segunda oportunidad**, al llenarse la bandeja | Se devuelven 3 fichas al tablero y sigue jugando |
| **Botón "Gana talentos"**, en la tienda, cuando le faltan talentos | 10 talentos por acierto, hasta 5 veces al día |

### Reglas pensadas para adultos mayores
- **Las preguntas son fáciles**, de historias muy conocidas, con **3 opciones** en botones grandes y sin tiempo límite.
- **Equivocarse nunca castiga.** Si la respuesta es incorrecta, se muestra con cariño la correcta y la cita ("La respuesta es **Noé**. Génesis 6:13-14"), y se da igualmente la mitad del premio.
- La pregunta y las opciones **se pueden escuchar en voz alta** (§6c).
- Una pregunta no se repite hasta agotar el banco, mediante una permutación determinista igual que con los versículos.

### Banco de preguntas (`src/data/preguntas.json`)
```json
{ "id": 1, "pregunta": "¿Quién construyó el arca?",
  "opciones": ["Noé", "Moisés", "Pedro"], "correcta": 0,
  "ref": "Génesis 6:13-14", "dificultad": "facil" }
```

Las opciones se barajan al mostrarlas. Ejemplos iniciales (meta: unas 200 preguntas, cotejadas con la RVR1960):

| Pregunta | Opciones (✔ correcta) | Cita |
|---|---|---|
| ¿Quién construyó el arca? | ✔ Noé · Moisés · Pedro | Génesis 6 |
| ¿Quién venció al gigante Goliat? | ✔ David · Saúl · Sansón | 1 Samuel 17 |
| ¿En qué ciudad nació Jesús? | ✔ Belén · Nazaret · Jericó | Mateo 2:1 |
| ¿Quién fue tragado por un gran pez? | ✔ Jonás · Elías · Daniel | Jonás 1:17 |
| ¿A quién echaron al foso de los leones? | ✔ Daniel · José · Pablo | Daniel 6 |
| ¿Cuál es el primer libro de la Biblia? | ✔ Génesis · Éxodo · Mateo | — |
| ¿Quién recibió las tablas de la ley en el monte Sinaí? | ✔ Moisés · Abraham · Josué | Éxodo 31:18 |
| ¿Cuántos discípulos escogió Jesús? | ✔ Doce · Siete · Cuarenta | Mateo 10:1-4 |
| Completa: "Jehová es mi ___; nada me faltará" | ✔ pastor · rey · amigo | Salmos 23:1 |
| ¿Quién era la esposa de Abraham? | ✔ Sara · Rut · Ester | Génesis 17:15 |

### Tienda "El Alfolí": canje de recompensas
Los talentos ganados en niveles y preguntas se **canjean** por:

| Categoría | Ejemplos | Precio orientativo |
|---|---|---|
| Ayudas | Lámpara, Viento recio, Volver al camino, Ensancha tu tienda | 20–60 talentos |
| Fondos de tablero | Mar de Galilea, Monte de los Olivos, Templo, Campo de trigo, Atardecer | 150–300 |
| Juegos de fichas | "Instrumentos de alabanza", "Animales del arca", "Frutos del Espíritu" | 300–500 |
| Tarjetas de versículo | Marcos decorados para copiar o descargar como imagen y compartir | 100 |
| Melodías | Himnos instrumentales adicionales (§6d) | 200 |

**Sin dinero real:** todo se gana jugando o respondiendo preguntas.

---

## 6c. Accesibilidad y facilidad para adultos de 60+

- **Texto grande:** el cuerpo mide como mínimo 20 px, los títulos 28 px o más, y la fuente es muy legible (Atkinson Hyperlegible o Nunito). En Configuración se puede elegir Normal, Grande o Muy grande.
- **Botones grandes:** todos los botones miden como mínimo 56×56 px, están separados entre sí y combinan **ícono y texto**, sin depender de íconos solos.
- **Alto contraste:** el contraste del texto es de al menos AAA (7:1). Cada ficha se distingue **por forma y por color**, algo que la app de referencia descuidó según sus reseñas. Hay un modo de alto contraste.
- **Lectura en voz alta:** hay un botón 🔊 en los versículos, las preguntas y el tutorial. Usa la Web Speech API (`speechSynthesis`) con una voz `es-*` y velocidad 0,9.
- **Sin presiones:** no hay temporizadores, cuentas regresivas, vidas ni esperas. Se puede pausar en cualquier momento y la partida se guarda sola.
- **Navegación simple:** como mucho 2 clics para llegar a jugar. El botón principal "▶ Jugar" ocupa casi todo el ancho del inicio y siempre hay un "← Volver" visible.
- **Interactividad que acompaña:** las fichas responden al clic con un rebote suave, cada trío suelta destellos, se oyen mensajes de ánimo ("¡Muy bien, Ana!") y la victoria se celebra con palomas y confeti.
- **Confirmar acciones delicadas:** "Reiniciar progreso" pide confirmación con una explicación clara.
- **Pantallas:** se diseña primero para el **navegador de escritorio** (computadora o notebook, de 1280×720 en adelante) y se adapta a tablet y celular, en vertical y horizontal.
- **Mouse y teclado:** el cursor es grande (opcional) y hay resaltado al pasar el mouse. Se puede jugar con teclado (Tab, Enter y Esc para pausar) para quien tenga dificultad con el mouse. El zoom del navegador (Ctrl +) no rompe el diseño.
- **Sin instalación:** se abre desde un enlace, sin registrarse ni descargar nada.

---

## 6d. Menú de Configuración

Se abre con el ícono ⚙️ "Configuración", siempre visible en el inicio y en el menú de pausa. Los cambios se aplican al instante, se guardan en `localStorage` y hay un botón **"Restaurar valores recomendados"**.

| Sección | Opción | Valores | Por defecto |
|---|---|---|---|
| **Jugador** | Nombre | texto (1–20 caracteres) | el ingresado al inicio |
| **Dificultad** | Nivel de dificultad | Muy fácil · Fácil · Normal · Desafío | **Fácil** |
| | Ayuda automática (pista tras 15 s) | Sí / No | Sí |
| | Aviso de bandeja casi llena | Sí / No | Sí |
| **Gráficos** | Calidad | Baja · Media · Alta · Automática | Automática |
| | Cuadros por segundo (FPS) | 30 (ahorro de batería) · 60 · Máximo del dispositivo | 60 |
| | Animaciones | Completas · Reducidas | según `prefers-reduced-motion` |
| | Mostrar FPS en pantalla | Sí / No | No |
| **Sonido** | Volumen general | 0–100 % | 70 % |
| | Música | 0–100 % | 40 % |
| | Efectos | 0–100 % | 70 % |
| | Melodía | lista de himnos desbloqueados | "Sublime gracia" |
| | Lectura en voz alta | Sí / No, más velocidad de voz | Sí, 0,9 |
| **Pantalla** | Tamaño de texto | Normal · Grande · Muy grande | Grande |
| | Alto contraste | Sí / No | No |
| | Tema | Claro · Oscuro · Automático | Claro |
| | Cursor grande | Sí / No | No |
| | Pantalla completa | botón que activa la Fullscreen API | — |
| **Datos** | Exportar / importar progreso | código para copiar y pegar en otro navegador | — |
| | Reiniciar progreso | botón con confirmación | — |
| | Acerca de y créditos | derechos RVR1960, música y licencias | — |

**Qué cambia cada nivel de dificultad:**

| | Muy fácil | Fácil | Normal | Desafío |
|---|---|---|---|---|
| Espacios de la bandeja | 8 | 8 | 7 | 7 |
| Multiplicador de fichas y tipos | ×0,6 | ×0,8 | ×1 | ×1,2 |
| Capas máximas | 2 | 3 | 4 | 5 |
| Ayudas gratis por nivel | 3 | 2 | 1 | 0 |
| Premio en talentos | ×1 | ×1 | ×1,2 | ×1,5 |

**Qué cambia cada nivel de calidad gráfica:**
- **Baja:** sin sombras ni partículas, transiciones simples y `devicePixelRatio` limitado a 1. Pensada para computadoras antiguas o navegadores lentos.
- **Media:** sombras simples y pocas partículas.
- **Alta:** sombras suaves, destellos, palomas animadas en la victoria y fondo con movimiento sutil.
- **Automática:** mide los FPS reales durante los primeros segundos y baja la calidad si están por debajo de 45.

**Implementación de FPS:** el tablero se dibuja con DOM y CSS. Las partículas y efectos van en un `<canvas>` superpuesto, con un bucle `requestAnimationFrame` que respeta el límite elegido (descarta cuadros según el intervalo objetivo). Un medidor opcional muestra los FPS en una esquina.

### Música tranquila
- **Estilo:** instrumental suave de **piano, arpa o cuerdas**, a 60–72 BPM, sin percusión ni cambios bruscos, en bucle sin cortes.
- **Repertorio:** arreglos propios de **himnos de dominio público**, por ejemplo:
  - "Sublime gracia" (*Amazing Grace*)
  - "Santo, Santo, Santo"
  - "Oh, qué amigo nos es Cristo"
  - "Estoy bien con mi Dios" (*It Is Well with My Soul*)
  - "Castillo fuerte es nuestro Dios"
- **Evitar** himnos y coros con derechos vigentes, como "Grande es tu fidelidad" o "Cuán grande es Él". Las **grabaciones** también deben ser propias o tener licencia CC0 o CC-BY, aunque la melodía sea de dominio público.
- **Técnica:**
  - Archivos `.ogg` u `.mp3` de unos 1–2 MB cada uno, que se cargan solo cuando hacen falta.
  - Fundido de entrada y salida de 2 segundos.
  - La música arranca tras el primer clic, por la política de autoplay de los navegadores.
  - Al ganar o al aparecer una pregunta, la música baja de volumen automáticamente (*ducking*).
- **Efectos de sonido:** suaves y agradables. Un "toc" de madera al elegir una ficha, una campanita al completar un trío y un acorde de arpa en la victoria. No hay sonidos de error estridentes.

---

## 7. Arquitectura técnica

**Stack:** **Vite + TypeScript**, sin framework.
- **Tablero:** se dibuja con DOM y CSS transforms, porque son 75 fichas como máximo y así cada ficha es un `<button>` accesible y se ve nítida en cualquier pantalla.
- **Efectos:** las partículas, el confeti y las palomas van en un `<canvas>` superpuesto, con un bucle `requestAnimationFrame` que respeta el límite de FPS y la calidad elegidos (§6d).
- **Animaciones:** Web Animations API. Todas respetan "Animaciones reducidas".
- **Audio:** Web Audio API con canales separados de música, efectos y voz, cada uno con su volumen, fundidos y *ducking*. La voz usa la Web Speech API (`speechSynthesis`, es-*).
- **Juego web puro:** es un sitio estático (HTML, CSS y JS) que se abre desde un enlace en cualquier navegador moderno (Chrome, Edge, Firefox, Safari). No requiere instalación. Opcionalmente, un service worker (`vite-plugin-pwa`) guarda los archivos en caché para que cargue rápido en visitas siguientes y siga funcionando si se corta internet.
- **Guardado:** `localStorage` con un esquema versionado y migraciones. Guarda el nombre, nivel actual, estrellas, talentos, boosters, compras de la tienda, versículos recibidos, favoritos, preguntas vistas, racha diaria y configuración.

```
/
├─ index.html
├─ netlify.toml
├─ public/            # favicon, og-image, fuentes
│  └─ audio/          # himnos instrumentales (.ogg/.mp3) y efectos
├─ src/
│  ├─ main.ts         # arranque y router de pantallas
│  ├─ core/
│  │  ├─ rng.ts            # mulberry32 + hash de semilla
│  │  ├─ layouts.ts        # plantillas de figuras
│  │  ├─ generator.ts      # geometría + orden de retirada + asignación de tipos
│  │  ├─ difficulty.ts     # parámetros según n y modo de dificultad (curva suave con techo)
│  │  ├─ solver.ts         # verificación de solución
│  │  └─ game.ts           # estado: tablero, bandeja, tríos, victoria/derrota, segunda oportunidad
│  ├─ content/
│  │  ├─ tiles.ts          # catálogo de fichas (id, svg, tags)
│  │  ├─ books.ts          # 66 libros → capítulos de 20 niveles
│  │  ├─ verses.ts         # selección de versículo por nivel
│  │  └─ quiz.ts           # selección de preguntas sin repetir
│  ├─ data/
│  │  ├─ versiculos.json
│  │  └─ preguntas.json
│  ├─ economy/
│  │  ├─ wallet.ts         # talentos, recompensas, racha diaria
│  │  └─ shop.ts           # catálogo del Alfolí y canjes
│  ├─ settings/
│  │  └─ settings.ts       # valores por defecto, persistencia, aplicación en vivo
│  ├─ fx/
│  │  ├─ loop.ts           # rAF con límite de FPS + medidor + calidad automática
│  │  └─ particles.ts      # destellos, confeti, palomas
│  ├─ ui/              # pantallas: bienvenida(nombre), inicio, mapa, juego, pausa, victoria,
│  │                   #   casi-lo-logras, pregunta, cofre, alfolí, mis-versículos, configuración, acerca
│  ├─ storage.ts
│  ├─ audio.ts        # música, efectos, ducking
│  ├─ speech.ts       # lectura en voz alta
│  └─ styles/         # tokens de tamaño de texto, contraste y tema
└─ tests/             # Vitest: generador resoluble, determinismo, versículos, preguntas, economía, settings
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

[[headers]]
  for = "/audio/*"
  [headers.values]
    Cache-Control = "public, max-age=2592000"
```
Se despliega conectando el repositorio de GitHub a Netlify (despliegue continuo) o con `netlify deploy --prod`.

---

## 8. Fases de desarrollo

| Fase | Entregable | Estimación |
|---|---|---|
| **0. Setup** | Vite + TS, ESLint y Vitest, primer despliegue "hola mundo" en Netlify | 0,5 día |
| **1. Núcleo jugable** | Tablero con capas, fichas libres, bandeja, tríos, aviso de bandeja casi llena, victoria y "casi lo logras", con 1 nivel fijo | 2 días |
| **2. Generador infinito** | Semilla, plantillas, orden de retirada, curva suave, 4 modos de dificultad, solver y tests de 10 000 niveles resolubles | 2–3 días |
| **3. Contenido** | 24 SVG de fichas, 66 libros y capítulos, unos 150 versículos y 100 preguntas verificados | 3–4 días |
| **4. Pantallas y flujo** | Bienvenida con nombre, inicio, mapa, tutorial guiado, victoria con versículo, Mis versículos, Acerca y créditos | 2–3 días |
| **5. Configuración** | Menú completo de §6d: calidad, FPS, sonido, dificultad, texto, contraste y tema, aplicado en vivo | 1,5 días |
| **6. Preguntas y recompensas** | Cofre cada 3 niveles, pregunta del día, segunda oportunidad, talentos, tienda "El Alfolí" y 4 boosters | 2–3 días |
| **7. Audio y voz** | Música tranquila (3 himnos de dominio público arreglados), efectos suaves, ducking y lectura en voz alta | 1,5 días |
| **8. Pulido y accesibilidad** | Partículas según calidad, animaciones, revisión AAA, prueba con 3 a 5 personas de 60+ y ajustes según lo observado, caché del navegador | 2–3 días |
| **9. Lanzamiento** | Revisión de derechos de RVR1960 y música, Lighthouse > 90, dominio y metadatos OG en Netlify | 0,5 día |

**MVP para probar con el público** (fases 0, 1, 2, una versión básica de la 4 y la 5 solo con dificultad y sonido): unos 6–7 días. **Conviene ponerlo pronto en manos de personas mayores reales.**

---

## 9. Criterios de aceptación

- [ ] Todos los niveles del 1 al 10 000 se generan en menos de 50 ms y son resolubles, en los 4 modos de dificultad (test automatizado).
- [ ] El mismo número de nivel y la misma dificultad producen siempre el mismo tablero.
- [ ] Cada victoria muestra un versículo RVR1960 con su referencia y el botón 🔊. No se repite dentro de la misma vuelta del pool.
- [ ] El primer inicio pide el nombre. El nombre aparece en el saludo, la victoria y "casi lo logras", y se puede editar en Configuración.
- [ ] El cofre aparece cada 3 niveles y la pregunta del día una vez al día. Equivocarse da la mitad del premio y muestra la respuesta con su cita.
- [ ] Los talentos se pueden canjear en el Alfolí y lo comprado se mantiene al recargar la página.
- [ ] Cada opción de Configuración (calidad, FPS, volúmenes, dificultad, texto, contraste, tema y cursor grande) se aplica al instante y se mantiene al recargar.
- [ ] El límite de 30 FPS se cumple, comprobado con el medidor en pantalla.
- [ ] La música es tranquila, arranca tras el primer clic y baja de volumen en preguntas y victorias.
- [ ] No hay ningún temporizador. Todos los botones y fichas miden 56 px o más y el texto 20 px o más.
- [ ] Una persona de 60+ sin experiencia completa el tutorial y 3 niveles sin ayuda externa.
- [ ] Después de la primera visita, el juego carga rápido desde la caché del navegador.
- [ ] Se juega bien con mouse en Chrome, Edge, Firefox y Safari de escritorio, y también en el navegador de tablet y celular (desde 360 px de ancho).
- [ ] Se puede jugar completo solo con teclado.
- [ ] El crédito de copyright de la RVR1960 se ve en Acerca y en la pantalla de versículos.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Derechos de la RVR1960 | Limitar el pool, incluir el aviso y confirmar la política de SBU antes de publicar |
| Derechos de la música | Usar solo himnos de dominio público, con arreglo y grabación propios o CC0/CC-BY, y registrar las licencias en Acerca |
| Errores de transcripción en versículos y preguntas | Cotejar todo contra la RVR1960 y agregar un test que valide el formato de las referencias y que cada pregunta tenga una sola correcta |
| Fichas poco distinguibles (la queja de las reseñas) | Diferenciar por forma y por color, probar con simulador de daltonismo y ofrecer un modo de alto contraste |
| Frustración del público mayor | Curva suave, bandeja de 8, segunda oportunidad con pregunta, ayuda automática, ajuste automático tras 2 fallos y pruebas con usuarios reales |
| Computadoras o navegadores lentos | Calidad automática, límite de 30 FPS, DOM liviano y efectos solo en canvas desactivable |
| El progreso vive en el navegador | Si se borran los datos del navegador o se cambia de equipo, se pierde. Se agrega en Configuración "Exportar/Importar progreso" (un código para copiar) |
| Voz de lectura no disponible en el dispositivo | Detectar si hay voz `es-*` y, si no la hay, ocultar el botón 🔊 sin romper nada |
| Monotonía en niveles altos | Plantillas variadas, fichas y fondos nuevos por vuelta, cofres y premios |
