// ===== CONFIGURACIÓN =====

// Dirección de la API que devuelve la lista de personajes
const URL_API = "https://rickandmortyapi.com/api/character";

// ===== ELEMENTOS DEL HTML =====
// Aquí "atrapamos" las piezas del index.html usando sus id,
// para poder escribir dentro de ellas desde JavaScript

const contenedorResultados = document.getElementById("resultados"); // zona de tarjetas
const mensaje = document.getElementById("mensaje");                 // zona de mensajes

// Conectamos el buscador y los filtros usando sus id del HTML.
const buscador = document.getElementById("buscador");
const filtroEstado = document.getElementById("filtro-estado");
const filtroGenero = document.getElementById("filtro-genero");
const filtroEspecie = document.getElementById("filtro-especie");

// Controles para navegar por los resultados que entrega la API por páginas.
const paginacion = document.getElementById("paginacion");
const botonAnterior = document.getElementById("pagina-anterior");
const botonSiguiente = document.getElementById("pagina-siguiente");
const infoPagina = document.getElementById("info-pagina");

// Guardamos la página mostrada y el total de páginas de la consulta actual.
let paginaActual = 1;
let totalPaginas = 0;

// El temporizador permite esperar a que el usuario deje de escribir.
let temporizadorBusqueda;

// Este controlador permite cancelar una consulta que ya quedó antigua.
let controladorConsulta;

// ===== FUNCIONES AUXILIARES =====

// Traduce el estado que manda la API (en inglés) a español
function traducirEstado(estado) {
  if (estado === "Alive") return "Vivo";
  if (estado === "Dead") return "Muerto";
  return "Desconocido";
}

// Muestra un texto en la zona de mensajes (por ejemplo "Cargando...")
function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

// Borra el mensaje cuando ya no hace falta
function limpiarMensaje() {
  mensaje.textContent = "";
}

// Construye la dirección de consulta con los controles actuales.
function crearUrlConsulta(pagina) {
  // URLSearchParams prepara los parámetros y codifica espacios y símbolos.
  const parametros = new URLSearchParams();

  // trim elimina espacios accidentales al principio y al final del nombre.
  const nombre = buscador.value.trim();

  // Solo enviamos los campos que tengan un valor seleccionado.
  if (nombre) parametros.set("name", nombre);
  if (filtroEstado.value) parametros.set("status", filtroEstado.value);
  if (filtroGenero.value) parametros.set("gender", filtroGenero.value);
  if (filtroEspecie.value) parametros.set("species", filtroEspecie.value);

  // La API usa page para elegir la página; omitirlo equivale a pedir la primera.
  if (pagina > 1) parametros.set("page", pagina);

  // Sin parámetros, la API vuelve a mostrar la primera página general.
  const consulta = parametros.toString();
  return consulta ? `${URL_API}?${consulta}` : URL_API;
}

// Una búsqueda distinta empieza desde la primera página y oculta datos antiguos.
function reiniciarPaginacion() {
  paginaActual = 1;
  totalPaginas = 0;
  paginacion.hidden = true;
  botonAnterior.disabled = true;
  botonSiguiente.disabled = true;
  infoPagina.textContent = "";
}

// Actualiza el indicador y evita avanzar fuera del rango de páginas.
function actualizarPaginacion(pagina, total) {
  paginaActual = pagina;
  totalPaginas = total;
  infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
  botonAnterior.disabled = paginaActual <= 1;
  botonSiguiente.disabled = paginaActual >= totalPaginas;
  paginacion.hidden = false;
}

// ===== CREAR TARJETAS =====

// Recibe la lista de personajes y dibuja una tarjeta por cada uno
function mostrarPersonajes(personajes) {
  // Primero vaciamos las tarjetas anteriores
  contenedorResultados.innerHTML = "";

  // Recorremos la lista, personaje por personaje
  personajes.forEach(function (personaje) {
    // Creamos un contenedor nuevo para la tarjeta
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";

    // Llenamos la tarjeta con la imagen y la descripción del personaje
    tarjeta.innerHTML = `
      <img src="${personaje.image}" alt="Foto de ${personaje.name}">
      <div class="tarjeta-info">
        <h3>${personaje.name}</h3>
        <span class="etiqueta">${traducirEstado(personaje.status)}</span>
        <p>Especie: ${personaje.species}</p>
        <p>Género: ${personaje.gender}</p>
        <p>Origen: ${personaje.origin.name}</p>
        <p>Ubicación: ${personaje.location.name}</p>
      </div>
    `;

    // Metemos la tarjeta terminada dentro de la página
    contenedorResultados.appendChild(tarjeta);
  });
}

// ===== CONSULTAR LA API =====

// Función principal: pide los personajes y los muestra
async function cargarPersonajes(pagina = 1) {
  // Cancelamos la petición anterior para que no reemplace la búsqueda nueva.
  if (controladorConsulta) controladorConsulta.abort();

  // Cada consulta conserva su propio controlador durante toda la función.
  const controladorActual = new AbortController();
  controladorConsulta = controladorActual;

  // Bloqueamos los dos botones durante la carga para evitar clics repetidos.
  botonAnterior.disabled = true;
  botonSiguiente.disabled = true;
  if (!paginacion.hidden) infoPagina.textContent = "Cargando página...";
  contenedorResultados.setAttribute("aria-busy", "true");

  // Avisamos al usuario que estamos buscando
  mostrarMensaje("Cargando personajes...");
  contenedorResultados.innerHTML = "";

  // try/catch: "intenta esto, y si algo falla, haz esto otro"
  try {
    // Mandamos el mensajero a la API y esperamos su respuesta
    const respuesta = await fetch(crearUrlConsulta(pagina), {
      // La señal permite detener esta petición cuando cambia la búsqueda.
      signal: controladorActual.signal
    });

    // Ignoramos cualquier respuesta que ya haya sido cancelada.
    if (controladorActual.signal.aborted) return;

    // Si la API contesta 404, significa que no encontró resultados
    if (respuesta.status === 404) {
      // Sin resultados no hay páginas por las que navegar.
      reiniciarPaginacion();
      mostrarMensaje("No se encontraron personajes.");
      return; // terminamos aquí
    }

    // Si la API contesta con cualquier otro error (500, etc.)
    if (!respuesta.ok) {
      throw new Error("La API respondió con un error: " + respuesta.status);
    }

    // Convertimos la respuesta a datos que JavaScript entiende (JSON)
    const datos = await respuesta.json();

    // El usuario también puede cambiar la búsqueda mientras leemos el JSON.
    if (controladorActual.signal.aborted) return;

    // Cubrimos también una respuesta correcta que traiga una lista vacía.
    if (datos.results.length === 0) {
      // También ocultamos la navegación si la lista viene vacía.
      reiniciarPaginacion();
      mostrarMensaje("No se encontraron personajes.");
      return;
    }

    // Los personajes vienen dentro de "results"
    limpiarMensaje();
    mostrarPersonajes(datos.results);

    // info.pages indica cuántas páginas tiene esta combinación de filtros.
    actualizarPaginacion(pagina, datos.info.pages);
  } catch (error) {
    // Cancelar una búsqueda antigua es normal: no mostramos un error por eso.
    if (controladorActual.signal.aborted) return;

    // Si no hubo internet o la API no responde, caemos aquí
    console.error(error); // lo dejamos en la consola para depurar
    // Ocultamos la navegación porque no se pudo obtener una página válida.
    reiniciarPaginacion();
    mostrarMensaje("No se pudo conectar con la API. Intenta de nuevo más tarde.");
  } finally {
    // Una consulta cancelada no debe modificar el estado de la nueva consulta.
    if (!controladorActual.signal.aborted) {
      contenedorResultados.setAttribute("aria-busy", "false");
    }
  }
}

// ===== BUSCADOR Y FILTROS =====

// input se ejecuta al escribir, pegar texto o borrar el nombre.
buscador.addEventListener("input", function () {
  // Reiniciamos la espera con cada cambio para no consultar por cada letra.
  clearTimeout(temporizadorBusqueda);

  // Un nombre nuevo puede tener menos páginas: siempre volvemos a la primera.
  reiniciarPaginacion();

  // Cancelamos enseguida para no mostrar resultados de un nombre anterior.
  if (controladorConsulta) controladorConsulta.abort();
  contenedorResultados.innerHTML = "";
  mostrarMensaje("Cargando personajes...");

  // Tras 350 milisegundos sin cambios, consultamos el nombre completo.
  temporizadorBusqueda = setTimeout(cargarPersonajes, 350);
});

// Los filtros consultan inmediatamente y conservan el nombre escrito.
[filtroEstado, filtroGenero, filtroEspecie].forEach(function (filtro) {
  filtro.addEventListener("change", function () {
    // Evitamos repetir una búsqueda que estaba esperando en el temporizador.
    clearTimeout(temporizadorBusqueda);
    // Cambiar un filtro también inicia una nueva lista desde su primera página.
    reiniciarPaginacion();
    cargarPersonajes();
  });
});

// Retrocede una página conservando el nombre y todos los filtros actuales.
botonAnterior.addEventListener("click", function () {
  if (!botonAnterior.disabled && paginaActual > 1) {
    cargarPersonajes(paginaActual - 1);
  }
});

// Avanza solo si existe otra página; durante la carga el botón está bloqueado.
botonSiguiente.addEventListener("click", function () {
  if (!botonSiguiente.disabled && paginaActual < totalPaginas) {
    cargarPersonajes(paginaActual + 1);
  }
});

// ===== INICIO =====

// Al abrir la página, cargamos los personajes automáticamente
cargarPersonajes();
