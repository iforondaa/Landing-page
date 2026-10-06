/** Marca como activo el enlace del encabezado que corresponde a la ruta actual. */
export function marcarNavActivo(clave) {
  for (const enlace of document.querySelectorAll('[data-nav]')) {
    if (enlace.dataset.nav === clave) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  }
}

/** "Saltar al contenido": mueve el foco al <main> sin cambiar la ruta. */
export function activarSaltoAlContenido() {
  const enlace = document.querySelector('[data-saltar]');
  const principal = document.getElementById('contenido');
  enlace?.addEventListener('click', (e) => {
    e.preventDefault();
    principal.focus();
    principal.scrollIntoView({ block: 'start' });
  });
}
