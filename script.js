// ===== CONFIGURACIÓN =====

// Dirección de la API que devuelve la lista de personajes
const URL_API = "https://rickandmortyapi.com/api/character";

// ===== ELEMENTOS DEL HTML =====
// Aquí "atrapamos" las piezas del index.html usando sus id,
// para poder escribir dentro de ellas desde JavaScript

const contenedorResultados = document.getElementById("resultados"); // zona de tarjetas
const mensaje = document.getElementById("mensaje");                 // zona de mensajes

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
  // Avisamos al usuario que estamos buscando
  mostrarMensaje("Cargando personajes...");
  contenedorResultados.innerHTML = "";

  // try/catch: "intenta esto, y si algo falla, haz esto otro"
  try {
    // Mandamos el mensajero a la API y esperamos su respuesta
    const respuesta = await fetch(URL_API);

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

    // Los personajes vienen dentro de "results"
    limpiarMensaje();
    mostrarPersonajes(datos.results);
  } catch (error) {
    // Si no hubo internet o la API no responde, caemos aquí
    console.error(error); // lo dejamos en la consola para depurar
    mostrarMensaje("No se pudo conectar con la API. Intenta de nuevo más tarde.");
  }
}

// ===== INICIO =====

// Al abrir la página, cargamos los personajes automáticamente
cargarPersonajes();
