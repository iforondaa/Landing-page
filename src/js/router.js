/**
 * Enrutador por hash (#/ruta). Sin dependencias.
 *
 * Cada ruta: { patron: '/publicacion/:id', vista, seccion?, nav? }
 *  - vista(contexto) → { nodo, titulo } | Promise<{ nodo, titulo }>
 *  - seccion: id de una sección de la vista a la que se desplaza al llegar.
 *  - nav: clave del enlace del encabezado que se marca como activo.
 */

/** "#/publicacion/abc/?x=1" → "/publicacion/abc" */
export function normalizarRuta(hash) {
  let ruta = String(hash ?? '').replace(/^#/, '').split('?')[0];
  if (!ruta.startsWith('/')) ruta = `/${ruta}`;
  ruta = ruta.replace(/\/+$/, '');
  return ruta || '/';
}

/** Devuelve { ruta, params, camino } de la primera ruta que coincide, o null. */
export function coincidir(rutas, hash) {
  const camino = normalizarRuta(hash);
  const partes = camino.split('/').filter(Boolean);
  for (const ruta of rutas) {
    const segmentos = ruta.patron.split('/').filter(Boolean);
    if (segmentos.length !== partes.length) continue;
    const params = {};
    const ok = segmentos.every((seg, i) => {
      if (!seg.startsWith(':')) return seg === partes[i];
      try {
        params[seg.slice(1)] = decodeURIComponent(partes[i]);
        return true;
      } catch {
        return false; // codificación inválida (ej. "%E0%A4%A")
      }
    });
    if (ok) return { ruta, params, camino };
  }
  return null;
}

const prefiereMovimientoReducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function enfocar(el) {
  if (!el) return;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

export function crearRouter({ rutas, contenedor, contexto, vistaNoEncontrada, vistaError, alCambiar, sitio }) {
  let actual = null;
  let turno = 0;
  const rutaNoEncontrada = { patron: null, vista: vistaNoEncontrada };

  function irASeccion(id, suave) {
    const destino = id ? document.getElementById(id) : null;
    const comportamiento = suave && !prefiereMovimientoReducido() ? 'smooth' : 'auto';
    if (destino) {
      enfocar(destino);
      destino.scrollIntoView({ behavior: comportamiento, block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: comportamiento });
    }
  }

  async function resolver({ inicial = false } = {}) {
    const coincidencia = coincidir(rutas, location.hash) ?? { ruta: rutaNoEncontrada, params: {} };
    alCambiar?.(coincidencia);

    // Misma vista con los mismos parámetros (ej. "#/" → "#/colaborar"): solo desplazarse.
    const mismaVista = actual && !actual.error && actual.ruta.vista === coincidencia.ruta.vista &&
      JSON.stringify(actual.params) === JSON.stringify(coincidencia.params);
    if (mismaVista) {
      actual = coincidencia;
      irASeccion(coincidencia.ruta.seccion, true);
      return;
    }

    const miTurno = ++turno;
    const avisoCarga = setTimeout(() => {
      contenedor.classList.add('cargando');
      contenedor.setAttribute('aria-busy', 'true');
    }, 150);

    let resultado;
    let error = false;
    try {
      resultado = await coincidencia.ruta.vista({ ...contexto, params: coincidencia.params });
    } catch (e) {
      console.error(e);
      error = true;
      resultado = vistaError(e, () => { actual = null; resolver(); });
    }

    clearTimeout(avisoCarga);
    if (miTurno !== turno) return; // el usuario ya navegó a otra parte
    contenedor.classList.remove('cargando');
    contenedor.removeAttribute('aria-busy');
    contenedor.replaceChildren(resultado.nodo);
    document.title = resultado.titulo ? `${resultado.titulo} · ${sitio}` : sitio;
    actual = { ...coincidencia, error };

    if (coincidencia.ruta.seccion) {
      irASeccion(coincidencia.ruta.seccion, !inicial);
    } else {
      window.scrollTo(0, 0);
      if (!inicial) enfocar(contenedor.querySelector('h1') ?? contenedor);
    }
  }

  function iniciar() {
    window.addEventListener('hashchange', () => resolver());
    // Clic en un enlace a la ruta actual: el navegador no dispara hashchange, se resuelve a mano.
    document.addEventListener('click', (e) => {
      const enlace = e.target.closest?.('a[href^="#/"]');
      if (!enlace || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (normalizarRuta(enlace.getAttribute('href')) === normalizarRuta(location.hash)) {
        e.preventDefault();
        resolver();
      }
    });
    return resolver({ inicial: true });
  }

  return { iniciar, resolver };
}
