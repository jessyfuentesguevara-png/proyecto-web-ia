// ===== CONFIGURACIÓN =====

// Dirección de la API que devuelve la lista de personajes
const URL_API = "https://rickandmortyapi.com/api/character";

// Nombre con el que se guardan los favoritos dentro de localStorage
const CLAVE_FAVORITOS = "favoritos-rick-and-morty";

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

// Zona donde se dibujan los favoritos y su mensaje de "lista vacía".
const contenedorFavoritos = document.getElementById("favoritos");
const mensajeFavoritos = document.getElementById("mensaje-favoritos");

// ===== ESTADO DE LA APLICACIÓN =====

// Guardamos la página mostrada y el total de páginas de la consulta actual.
let paginaActual = 1;
let totalPaginas = 0;

// El temporizador permite esperar a que el usuario deje de escribir.
let temporizadorBusqueda;

// Este controlador permite cancelar una consulta que ya quedó antigua.
let controladorConsulta;

// Lista de personajes favoritos; se llena desde localStorage al iniciar.
let favoritos = [];

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

// Devuelve el nombre de un lugar (origen o ubicación) sin fallar si falta el dato.
function nombreLugar(lugar) {
  return lugar && lugar.name ? lugar.name : "Desconocido";
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
  return consulta ? URL_API + "?" + consulta : URL_API;
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
  infoPagina.textContent = "Página " + paginaActual + " de " + totalPaginas;
  botonAnterior.disabled = paginaActual <= 1;
  botonSiguiente.disabled = paginaActual >= totalPaginas;
  paginacion.hidden = false;
}

// ===== FAVORITOS (localStorage) =====

// Lee los favoritos guardados; si no hay nada o los datos están dañados, devuelve una lista vacía.
function leerFavoritos() {
  try {
    const guardado = localStorage.getItem(CLAVE_FAVORITOS);
    if (!guardado) return [];

    // JSON.parse convierte el texto guardado otra vez en una lista de JavaScript.
    const lista = JSON.parse(guardado);

    // Nos quedamos solo con elementos que tengan lo mínimo para dibujar una tarjeta.
    return Array.isArray(lista)
      ? lista.filter(function (p) { return p && p.id && p.name; })
      : [];
  } catch (error) {
    // Si localStorage está bloqueado o el texto está roto, empezamos sin favoritos.
    console.error(error);
    return [];
  }
}

// Guarda la lista actual de favoritos en el navegador.
function guardarFavoritos() {
  try {
    // localStorage solo guarda texto, por eso convertimos la lista con JSON.stringify.
    localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
  } catch (error) {
    console.error(error);
    mostrarMensaje("No se pudieron guardar los favoritos en este navegador.");
  }
}

// Dice si un personaje ya está en favoritos, comparando su id.
function esFavorito(id) {
  return favoritos.some(function (p) { return p.id === id; });
}

// Guarda solo los datos que necesita la tarjeta, para no llenar localStorage de más.
function resumirPersonaje(personaje) {
  return {
    id: personaje.id,
    name: personaje.name,
    image: personaje.image,
    status: personaje.status,
    species: personaje.species,
    gender: personaje.gender,
    origin: { name: nombreLugar(personaje.origin) },
    location: { name: nombreLugar(personaje.location) }
  };
}

// Pone en un botón el texto y el estado (aria-pressed) según sea favorito o no.
function pintarBotonFavorito(boton) {
  const activo = esFavorito(Number(boton.dataset.id));
  boton.setAttribute("aria-pressed", activo ? "true" : "false");
  boton.textContent = activo ? "★ Quitar de favoritos" : "☆ Agregar a favoritos";
}

// Actualiza todos los botones visibles (resultados y favoritos) a la vez.
function actualizarBotonesFavorito() {
  document.querySelectorAll(".boton-favorito").forEach(pintarBotonFavorito);
}

// Agrega el personaje a favoritos, o lo quita si ya estaba.
function alternarFavorito(personaje) {
  if (esFavorito(personaje.id)) {
    favoritos = favoritos.filter(function (p) { return p.id !== personaje.id; });
  } else {
    favoritos.push(resumirPersonaje(personaje));
  }

  // Guardamos y refrescamos la pantalla para que todo quede sincronizado.
  guardarFavoritos();
  mostrarFavoritos();
  actualizarBotonesFavorito();
}

// Dibuja la sección "Mis favoritos" con la lista actual.
function mostrarFavoritos() {
  contenedorFavoritos.innerHTML = "";

  // Si no hay favoritos, mostramos el aviso; si hay, lo ocultamos.
  const vacio = favoritos.length === 0;
  mensajeFavoritos.hidden = !vacio;
  mensajeFavoritos.textContent = vacio ? "Aún no tienes favoritos." : "";

  favoritos.forEach(function (personaje) {
    contenedorFavoritos.appendChild(crearTarjeta(personaje));
  });
}

// ===== CREAR TARJETAS =====

// Construye la tarjeta de un personaje (sirve para resultados y para favoritos).
function crearTarjeta(personaje) {
  // Creamos un contenedor nuevo para la tarjeta
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";

  // Imagen del personaje con texto alternativo descriptivo.
  const imagen = document.createElement("img");
  imagen.src = personaje.image;
  imagen.alt = "Foto de " + personaje.name;

  // Contenedor de la información de texto.
  const informacion = document.createElement("div");
  informacion.className = "tarjeta-info";

  // textContent muestra los datos como texto, sin interpretarlos como HTML.
  const nombre = document.createElement("h3");
  nombre.textContent = personaje.name;

  // Etiqueta con el estado; data-estado lo usa style.css para dar color.
  const etiqueta = document.createElement("span");
  etiqueta.className = "etiqueta";
  etiqueta.dataset.estado = String(personaje.status).toLowerCase();
  etiqueta.textContent = traducirEstado(personaje.status);

  // Colocamos el nombre y la etiqueta antes de los detalles.
  informacion.append(nombre, etiqueta);

  // Un párrafo por cada dato del personaje.
  [
    "Especie: " + personaje.species,
    "Género: " + personaje.gender,
    "Origen: " + nombreLugar(personaje.origin),
    "Ubicación: " + nombreLugar(personaje.location)
  ].forEach(function (texto) {
    const parrafo = document.createElement("p");
    parrafo.textContent = texto;
    informacion.appendChild(parrafo);
  });

  // Botón de favoritos; guarda el id para saber a qué personaje corresponde.
  const botonFavorito = document.createElement("button");
  botonFavorito.type = "button";
  botonFavorito.className = "boton-favorito";
  botonFavorito.dataset.id = personaje.id;
  botonFavorito.addEventListener("click", function () {
    alternarFavorito(personaje);
  });
  pintarBotonFavorito(botonFavorito);
  informacion.appendChild(botonFavorito);

  // Montamos la tarjeta terminada.
  tarjeta.append(imagen, informacion);
  return tarjeta;
}

// Recibe la lista de personajes y dibuja una tarjeta por cada uno
function mostrarPersonajes(personajes) {
  // Primero vaciamos las tarjetas anteriores
  contenedorResultados.innerHTML = "";

  // Recorremos la lista, personaje por personaje
  personajes.forEach(function (personaje) {
    contenedorResultados.appendChild(crearTarjeta(personaje));
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

// Al abrir la página, recuperamos los favoritos guardados y los mostramos.
favoritos = leerFavoritos();
mostrarFavoritos();

// Después cargamos los personajes automáticamente.
cargarPersonajes();
