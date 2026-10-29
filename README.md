# Explorador Rick and Morty

Aplicación web interactiva que consulta personajes de la [Rick and Morty API](https://rickandmortyapi.com/documentation) y permite buscarlos, filtrarlos y guardarlos como favoritos.

## Integrantes

- Cruz Quintal María de los Angeles (GitHub: angeles77734)
- Fuentes Guevara Jessica Rubí (GitHub: jessyfuentesguevara-png)

## Enlaces

- Repositorio: https://github.com/jessyfuentesguevara-png/proyecto-web-ia
- Aplicación en GitHub Pages: https://jessyfuentesguevara-png.github.io/proyecto-web-ia/

## Descripción

El proyecto está hecho con HTML, CSS y JavaScript puros. La página usa fetch() para pedir los datos reales de la API y los muestra en tarjetas con imagen y descripción. No hay información escrita a mano: todo viene de la API.

Funciones de la aplicación:

- Lista de personajes con imagen, estado, especie, género, origen y ubicación.
- Buscador por nombre.
- Filtros por estado, género y especie, que se pueden combinar con el buscador.
- Paginación con botones Anterior y Siguiente.
- Sección de favoritos guardada en localStorage.
- Mensajes cuando no hay resultados o falla la conexión con la API.
- Diseño adaptable a celulares y computadoras.
- Modo oscuro y claro (reto extra).

## Instrucciones de uso

1. Abrir la aplicación en GitHub Pages.
2. Escribir un nombre en el buscador para encontrar personajes.
3. Elegir un estado, género o especie en los filtros para organizar los resultados.
4. Usar los botones Anterior y Siguiente para ver más personajes.
5. Presionar Agregar a favoritos en una tarjeta para verla en la sección Mis favoritos. Los favoritos se conservan aunque se cierre la página.
6. Presionar el botón del encabezado para cambiar entre modo claro y modo oscuro. La elección también se conserva.

## Archivos del proyecto

- index.html: estructura de la página.
- style.css: estilos, diseño adaptable y colores del modo oscuro.
- script.js: conexión con la API, buscador, filtros, paginación, favoritos y modo oscuro.
- README.md: documentación del proyecto.

## Trabajo colaborativo en GitHub

- Commits: más de 10 commits en el historial, hechos por las dos integrantes desde la interfaz web de GitHub.
- Issues: Issue 1 (crear el buscador de personajes) e Issue 2 (agregar filtros y sección de favoritos), cerrados con commits que incluyen Closes #1 y Closes #2.
- Pull Request 3: modo oscuro y claro. Se trabajó en la rama modo-oscuro, un commit de Jessica con el botón, otro con la lógica y otro de María de los Ángeles con los colores. Fue revisado, aprobado y fusionado a main por María de los Ángeles.

## Uso de inteligencia artificial

Jessica usó Claude para analizar la tarea, planear los pasos y generar y explicar el código. María de los Ángeles usó su asistente de IA (indicar si fue ChatGPT o Claude) con los prompts que se describen abajo. La IA propuso el código, pero todo se subió y se probó manualmente desde GitHub.

### Tres prompts importantes

1. Análisis de la tarea (Jessica, Claude): "analiza el siguiente pdf debes hacer caso a cada requisito, empezando con olvidarnos de vs code, u otro editor de código, revisa cada especificación y dime como le vamos ir haciendo paso por paso". Resultado: un plan de 13 pasos, el reparto del trabajo entre las dos y el código comentado de index.html y script.js.
2. Buscador (María de los Ángeles): se le pidió modificar script.js para que el buscador consultara la API con el parámetro name, esperara 400 ms después de dejar de escribir (debounce), conservara los mensajes de sin resultados y de error, y creara una función construirURL() con URLSearchParams. Se le pidió código completo y comentado, y una explicación paso a paso.
3. Modo oscuro (María de los Ángeles): se le pidió un solo bloque de CSS para agregar al final de style.css, que redefiniera las variables de color cuando la etiqueta html tuviera data-tema="oscuro", con una paleta dada, estilos para el botón y una transición suave. Se le pidió explicar cómo funciona y cómo subirlo a la rama modo-oscuro.

### Respuesta de la IA que requirió correcciones

Al subir cambios desde el editor de GitHub, Copilot sugirió automáticamente un mensaje de commit en inglés: "Refactor script.js for improved readability and structure". No describía lo que se había hecho (se agregaron favoritos y se restauraron los filtros, no se hizo un refactor) y además estaba en inglés. Lo corregimos escribiendo mensajes propios en español y borrando las descripciones sugeridas.

### Error encontrado y cómo lo resolvimos

Después de subir el buscador, la página dejó de tener filtros y paginación. Al revisar el historial de commits vimos que el último commit del buscador había reemplazado todo script.js con una versión más simple, basada en una copia anterior del archivo, y había borrado unas 149 líneas de trabajo que ya funcionaba. Lo resolvimos recuperando la versión buena desde el commit anterior (05d4677), agregándole los favoritos y haciendo un nuevo commit. Aprendimos a revisar siempre qué cambia un commit antes de aceptarlo y a probar la página publicada después de cada cambio.

### Modificación al código que podemos explicar

El modo oscuro funciona con tres piezas:

- index.html: un botón con id boton-tema en el encabezado.
- script.js: al hacer clic, una función cambia el atributo data-tema de la etiqueta html entre claro y oscuro, cambia el texto del botón y guarda la elección en localStorage. Al abrir la página, lee ese valor guardado; si no hay ninguno, usa la preferencia del sistema con matchMedia.
- style.css: todos los colores estaban guardados en variables. El selector [data-tema="oscuro"] vuelve a definir esas variables con colores oscuros, así que toda la página cambia sin repetir estilos.

En resumen: el botón cambia un atributo, y el CSS usa ese atributo para cambiar las variables de color.

### Reflexión sobre lo aprendido con IA

Aprendimos que la IA acelera mucho el trabajo: nos dio código comentado y nos explicó cómo funciona cada parte. Pero también aprendimos que no se debe pegar sin revisar. Una respuesta basada en una versión vieja de un archivo borró funciones que ya servían, y solo lo notamos al revisar el historial. Desde entonces revisamos los cambios antes de guardarlos y probamos la página publicada. También entendimos mejor cómo se conectan HTML, CSS y JavaScript, y cómo se trabaja en equipo con ramas, Issues y Pull Requests.

## Reto extra

Elegimos el modo oscuro y claro. Se desarrolló en la rama modo-oscuro y se integró a main mediante el Pull Request 3. La explicación de su funcionamiento está en la sección Modificación al código que podemos explicar.

## Dificultades

- Dos personas editando el mismo archivo pueden pisarse: un commit sobrescribió script.js y hubo que recuperarlo desde el historial.
- Trabajar sin editor instalado, solo con el editor web de GitHub, obliga a pegar el código completo con cuidado.
- Copilot de GitHub propone mensajes de commit en inglés que hay que corregir.
- La primera publicación en GitHub Pages tarda uno o dos minutos en aparecer.
- La API devuelve 404 cuando una búsqueda no tiene resultados, y fetch() no lo trata como error, así que hubo que revisarlo aparte para mostrar el mensaje correcto.
