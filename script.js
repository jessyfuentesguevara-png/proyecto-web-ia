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
function crearUrlConsulta() {
  // URLSearchParams prepara los parámetros y codifica espacios y símbolos.
  const parametros = new URLSearchParams();

  // trim elimina espacios accidentales al principio y al final del nombre.
  const nombre = buscador.value.trim();

  // Solo enviamos los campos que tengan un valor seleccionado.
  if (nombre) parametros.set("name", nombre);
  if (filtroEstado.value) parametros.set("status", filtroEstado.value);
  if (filtroGenero.value) parametros.set("gender", filtroGenero.value);
  if (filtroEspecie.value) parametros.set("species", filtroEspecie.value);

  // Sin parámetros, la API vuelve a mostrar la primera página general.
  const consulta = parametros.toString();
  return consulta ? `${URL_API}?${consulta}` : URL_API;
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
async function cargarPersonajes() {
  // Cancelamos la petición anterior para que no reemplace la búsqueda nueva.
  if (controladorConsulta) controladorConsulta.abort();

  // Cada consulta conserva su propio controlador durante toda la función.
  const controladorActual = new AbortController();
  controladorConsulta = controladorActual;

  // Avisamos al usuario que estamos buscando
  mostrarMensaje("Cargando personajes...");
  contenedorResultados.innerHTML = "";

  // try/catch: "intenta esto, y si algo falla, haz esto otro"
  try {
    // Mandamos el mensajero a la API y esperamos su respuesta
    const respuesta = await fetch(crearUrlConsulta(), {
      // La señal permite detener esta petición cuando cambia la búsqueda.
      signal: controladorActual.signal
    });

    // Ignoramos cualquier respuesta que ya haya sido cancelada.
    if (controladorActual.signal.aborted) return;

    // Si la API contesta 404, significa que no encontró resultados
    if (respuesta.status === 404) {
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
      mostrarMensaje("No se encontraron personajes.");
      return;
    }

    // Los personajes vienen dentro de "results"
    limpiarMensaje();
    mostrarPersonajes(datos.results);
  } catch (error) {
    // Cancelar una búsqueda antigua es normal: no mostramos un error por eso.
    if (controladorActual.signal.aborted) return;

    // Si no hubo internet o la API no responde, caemos aquí
    console.error(error); // lo dejamos en la consola para depurar
    mostrarMensaje("No se pudo conectar con la API. Intenta de nuevo más tarde.");
  }
}

// ===== BUSCADOR Y FILTROS =====

// input se ejecuta al escribir, pegar texto o borrar el nombre.
buscador.addEventListener("input", function () {
  // Reiniciamos la espera con cada cambio para no consultar por cada letra.
  clearTimeout(temporizadorBusqueda);

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
    cargarPersonajes();
  });
});

// ===== INICIO =====

// Al abrir la página, cargamos los personajes automáticamente
cargarPersonajes();
