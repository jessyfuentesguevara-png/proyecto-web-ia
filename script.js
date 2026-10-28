// ===== CONFIGURACIÓN =====

// Dirección base para consultar personajes.
const URL_API = "https://rickandmortyapi.com/api/character";

// Esperamos 400 milisegundos desde el último cambio en el buscador.
const ESPERA_BUSQUEDA = 400;

// ===== ELEMENTOS DEL HTML =====

// Conectamos JavaScript con los elementos existentes de la página.
const contenedorResultados = document.getElementById("resultados");
const mensaje = document.getElementById("mensaje");
const buscador = document.getElementById("buscador");

// ===== ESTADO DEL BUSCADOR =====

// Guardamos el temporizador para reiniciarlo con cada cambio.
let temporizadorBusqueda;

// Guardamos el controlador para cancelar consultas antiguas.
let controladorConsulta;

// ===== FUNCIONES AUXILIARES =====

// Traducimos al español el estado recibido desde la API.
function traducirEstado(estado) {
  if (estado === "Alive") return "Vivo";
  if (estado === "Dead") return "Muerto";
  return "Desconocido";
}

// Escribimos un aviso en la zona de mensajes.
function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

// Quitamos el aviso cuando ya tenemos resultados.
function limpiarMensaje() {
  mensaje.textContent = "";
}

// Construimos la dirección usando únicamente el nombre escrito.
function construirURL() {
  // URLSearchParams organiza y codifica espacios y símbolos especiales.
  const parametros = new URLSearchParams();

  // Quitamos espacios accidentales al principio y al final.
  const nombre = buscador.value.trim();

  // Solo añadimos name cuando el usuario escribió algo.
  if (nombre !== "") {
    parametros.set("name", nombre);
  }

  // En el siguiente commit se podrán añadir aquí los filtros con parametros.set.

  // Convertimos los parámetros en una cadena lista para incluir en la URL.
  const consulta = parametros.toString();

  // Un campo vacío devuelve la dirección general, sin el parámetro name.
  if (consulta === "") {
    return URL_API;
  }

  // El signo de interrogación separa la dirección de los parámetros.
  return `${URL_API}?${consulta}`;
}

// ===== CREAR TARJETAS =====

// Dibujamos una tarjeta por cada personaje recibido.
function mostrarPersonajes(personajes) {
  // Quitamos las tarjetas de la consulta anterior.
  contenedorResultados.innerHTML = "";

  // Recorremos la lista y construimos sus elementos HTML.
  personajes.forEach(function (personaje) {
    // Conservamos las clases utilizadas por style.css.
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";

    // Creamos la imagen con un texto alternativo descriptivo.
    const imagen = document.createElement("img");
    imagen.src = personaje.image;
    imagen.alt = `Foto de ${personaje.name}`;

    // Preparamos el contenedor de información.
    const informacion = document.createElement("div");
    informacion.className = "tarjeta-info";

    // textContent muestra los datos como texto, sin interpretarlos como HTML.
    const nombre = document.createElement("h3");
    nombre.textContent = personaje.name;

    // Creamos la etiqueta con el estado traducido.
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta";
    etiqueta.textContent = traducirEstado(personaje.status);

    // Agrupamos los datos que se mostrarán como párrafos.
    const detalles = [
      `Especie: ${personaje.species}`,
      `Género: ${personaje.gender}`,
      `Origen: ${personaje.origin.name}`,
      `Ubicación: ${personaje.location.name}`
    ];

    // Colocamos el nombre y la etiqueta antes de los detalles.
    informacion.append(nombre, etiqueta);

    // Creamos un párrafo por cada dato.
    detalles.forEach(function (texto) {
      const parrafo = document.createElement("p");
      parrafo.textContent = texto;
      informacion.appendChild(parrafo);
    });

    // Montamos la tarjeta y la añadimos a la página.
    tarjeta.append(imagen, informacion);
    contenedorResultados.appendChild(tarjeta);
  });
}

// ===== CONSULTAR LA API =====

// Pedimos los personajes que coincidan con el nombre actual.
async function cargarPersonajes() {
  // Cancelamos la consulta anterior si todavía está en marcha.
  if (controladorConsulta) {
    controladorConsulta.abort();
  }

  // Cada consulta conserva su propio controlador.
  const controladorActual = new AbortController();
  controladorConsulta = controladorActual;

  // Indicamos que estamos cargando y quitamos resultados antiguos.
  mostrarMensaje("Cargando personajes...");
  contenedorResultados.innerHTML = "";

  // Intentamos consultar la API; catch atiende los errores.
  try {
    // Usamos la dirección generada y una señal para poder cancelar la consulta.
    const respuesta = await fetch(construirURL(), {
      signal: controladorActual.signal
    });

    // Una consulta cancelada no debe actualizar la pantalla.
    if (controladorActual.signal.aborted) return;

    // Conservamos el mensaje específico para una respuesta 404.
    if (respuesta.status === 404) {
      mostrarMensaje("No se encontraron personajes.");
      return;
    }

    // Los demás errores HTTP pasan al bloque catch.
    if (!respuesta.ok) {
      throw new Error("La API respondió con un error: " + respuesta.status);
    }

    // Convertimos la respuesta JSON en datos de JavaScript.
    const datos = await respuesta.json();

    // También puede haberse cancelado mientras leíamos el JSON.
    if (controladorActual.signal.aborted) return;

    // Cubrimos una respuesta correcta que incluya una lista vacía.
    if (datos.results.length === 0) {
      mostrarMensaje("No se encontraron personajes.");
      return;
    }

    // Quitamos el aviso y mostramos los personajes recibidos.
    limpiarMensaje();
    mostrarPersonajes(datos.results);
  } catch (error) {
    // Una cancelación es normal y no representa un fallo de conexión.
    if (controladorActual.signal.aborted) return;

    // Guardamos el detalle técnico y mostramos el aviso al usuario.
    console.error(error);
    mostrarMensaje("No se pudo conectar con la API. Intenta de nuevo más tarde.");
  }
}

// ===== ESCUCHAR EL BUSCADOR =====

// input detecta cambios al escribir, pegar texto o borrarlo.
buscador.addEventListener("input", function () {
  // Reiniciamos la espera con cada cambio para evitar consultar por cada letra.
  clearTimeout(temporizadorBusqueda);

  // Cancelamos inmediatamente cualquier consulta del nombre anterior.
  if (controladorConsulta) {
    controladorConsulta.abort();
  }

  // Quitamos las tarjetas antiguas mientras esperamos la consulta nueva.
  contenedorResultados.innerHTML = "";
  mostrarMensaje("Cargando personajes...");

  // Consultamos tras 400 milisegundos sin nuevos cambios.
  temporizadorBusqueda = setTimeout(cargarPersonajes, ESPERA_BUSQUEDA);
});

// ===== INICIO =====

// Al abrir la página cargamos la primera página general de personajes.
cargarPersonajes();
