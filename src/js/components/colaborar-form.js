/**
 * Formulario "Quiero colaborar" (Tarea 3 · Escenario BDD 1).
 *
 * - Obligatoriedad y longitudes máximas se derivan de spec/schemas (no se escriben a mano).
 * - La validación en pantalla usa el mismo validador, esquema y limpieza que la capa de datos;
 *   la capa de datos sigue siendo la autoridad final (sus errores también se pintan por campo).
 * - Los errores aparecen al salir del campo o al enviar, y desaparecen en cuanto se corrigen.
 */
import { h } from '../lib/dom.js';
import { schemas } from '../contract/schemas.generated.js';
import { crearValidador, restriccionesDeCampo } from '../lib/validator.js';
import { limpiarEntrada, OPCIONALES } from '../lib/normalizar.js';
import { ApiError } from '../data/api.js';

const SCHEMA_ID = 'colaborador.input.schema.json';
const validar = crearValidador(schemas);

/**
 * Rastreo único (a nivel de módulo) de si hay un puntero presionado. Si un campo pierde el foco
 * porque el usuario está pulsando otro elemento (p. ej. "Enviar"), mostrar su error en ese instante
 * desplaza el botón y el clic cae en el vacío; por eso esa validación espera a que se suelte el puntero.
 * Se instala una sola vez para no acumular escuchadores cada vez que se vuelve a pintar la vista.
 */
const puntero = { presionado: false, alSoltar: new Set() };
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', () => { puntero.presionado = true; }, true);
  const soltar = () => {
    puntero.presionado = false;
    const tareas = [...puntero.alSoltar];
    puntero.alSoltar.clear();
    setTimeout(() => tareas.forEach((t) => t())); // después del "click" de este mismo gesto
  };
  document.addEventListener('pointerup', soltar, true);
  document.addEventListener('pointercancel', soltar, true);
}

/** Longitud en caracteres Unicode, igual que JSON Schema (un emoji cuenta 1). */
const largo = (texto) => [...texto].length;

/** Presentación de cada campo. Los nombres deben coincidir con el esquema (lo verifica una prueba). */
export const CAMPOS = Object.freeze([
  { nombre: 'nombre_completo', etiqueta: 'Nombre completo', placeholder: 'ej. Antonio Machado Ruiz',
    attrs: { type: 'text', autocomplete: 'name' }, ancho: 'completo' },
  { nombre: 'email', etiqueta: 'Correo electrónico', placeholder: 'ejemplo@banobras.gob.mx',
    attrs: { type: 'email', autocomplete: 'email', inputmode: 'email', autocapitalize: 'off', spellcheck: 'false' }, ancho: 'completo' },
  { nombre: 'telefono', etiqueta: 'Teléfono', placeholder: 'ej. 554-365-0920',
    attrs: { type: 'tel', autocomplete: 'tel-national', inputmode: 'tel' } },
  { nombre: 'area_adscripcion', etiqueta: 'Área de adscripción', placeholder: 'ej. Dirección de Crédito',
    attrs: { type: 'text', autocomplete: 'organization-title' } },
  // Texto libre: área más alta que los demás campos (4 renglones, ampliable) y contador de caracteres.
  { nombre: 'comentario_propuesta', etiqueta: 'Comentario o propuesta',
    placeholder: 'ej. Me gustaría proponer pláticas sobre prestaciones laborales.',
    control: 'textarea', attrs: { rows: '4' }, ancho: 'completo', contador: true },
]);

/** Primer error de cada campo, según el contrato. */
function erroresPorCampo(datos) {
  const { errores } = validar(SCHEMA_ID, limpiarEntrada(datos, OPCIONALES.colaborador));
  const porCampo = {};
  for (const e of errores) porCampo[e.campo] ??= e.mensaje;
  return porCampo;
}

export function formularioColaborar({ api }) {
  const prefijo = 'colaborar';
  const controles = {};
  const tocados = new Set();
  let intentoEnvio = false;
  let enviando = false;

  const fmt = (n) => n.toLocaleString('es-MX');
  function actualizarContador(nombre) {
    const { input, contador, maxLength } = controles[nombre] ?? {};
    if (!contador) return;
    const n = largo(input.value);
    contador.textContent = `${fmt(n)} / ${fmt(maxLength)} caracteres`;
    contador.classList.toggle('campo__contador--limite', n >= maxLength * 0.9);
  }

  const campos = CAMPOS.map((c) => {
    const reglas = restriccionesDeCampo(schemas, SCHEMA_ID, c.nombre);
    const id = `${prefijo}-${c.nombre}`;
    const contador = c.contador ? h('p', { class: 'campo__contador', id: `${id}-contador` }) : null;
    const input = h(c.control ?? 'input', {
      id, name: c.nombre, placeholder: c.placeholder,
      'aria-describedby': contador?.id,
      // Sin "maxlength": el navegador cuenta unidades UTF-16 (un emoji = 2) y cortaría antes que el contrato.
      'aria-required': reglas.requerido ? 'true' : null,
      'aria-invalid': 'false', ...c.attrs,
    });
    const error = h('p', { class: 'campo__error', id: `${id}-error` });
    controles[c.nombre] = { input, error, contador, maxLength: reglas.maxLength };
    actualizarContador(c.nombre);
    return h('div', { class: `campo${c.ancho === 'completo' ? ' campo--completo' : ''}` },
      h('label', { class: 'campo__etiqueta', for: id },
        c.etiqueta,
        reglas.requerido
          ? h('span', { class: 'campo__req', 'aria-hidden': 'true' }, ' *')
          : h('span', { class: 'campo__opcional' }, ' (opcional)')),
      input,
      error,
      contador);
  });

  const boton = h('button', { class: 'boton formulario__enviar', type: 'submit' }, 'Enviar registro');
  const alerta = h('div', { class: 'alerta', role: 'alert', hidden: true });
  const anuncio = h('p', { class: 'visualmente-oculto', role: 'status', 'aria-live': 'polite' });

  const form = h('form', { class: 'formulario', novalidate: true, 'aria-labelledby': 'titulo-colaborar', 'aria-describedby': 'colaborar-nota' },
    h('p', { class: 'formulario__nota', id: 'colaborar-nota' }, 'Los campos marcados con ', h('span', { class: 'campo__req' }, '*'), ' son obligatorios.'),
    h('div', { class: 'formulario__rejilla' }, campos),
    alerta,
    h('div', { class: 'formulario__acciones' }, boton),
    anuncio,
  );


  const confirmacion = h('div', { class: 'confirmacion', tabindex: '-1', hidden: true });
  const contenedor = h('div', { class: 'tarjeta-form' }, form, confirmacion);

  const leer = () => Object.fromEntries(CAMPOS.map((c) => [c.nombre, controles[c.nombre].input.value]));

  function pintar(nombre, mensaje) {
    const { input, error, contador } = controles[nombre];
    error.textContent = mensaje ?? '';
    input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
    const ids = [mensaje ? error.id : null, contador?.id].filter(Boolean);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' '));
    else input.removeAttribute('aria-describedby');
  }

  const revisar = (nombre) => pintar(nombre, erroresPorCampo(leer())[nombre]);

  const pendientes = new Set();
  const revisarPendientes = () => { for (const n of pendientes) revisar(n); pendientes.clear(); };

  for (const { nombre } of CAMPOS) {
    const { input } = controles[nombre];
    input.addEventListener('blur', () => {
      if (input.value.trim() === '' && !tocados.has(nombre) && !intentoEnvio) return; // no regañar por solo pasar
      tocados.add(nombre);
      if (puntero.presionado) { pendientes.add(nombre); puntero.alSoltar.add(revisarPendientes); }
      else revisar(nombre);
    });
    input.addEventListener('input', () => {
      actualizarContador(nombre);
      const excede = controles[nombre].maxLength !== undefined && largo(input.value) > controles[nombre].maxLength;
      if (excede || input.getAttribute('aria-invalid') === 'true' || intentoEnvio) revisar(nombre);
    });
  }

  function mostrarAlerta(mensaje) {
    alerta.textContent = mensaje ?? '';
    alerta.hidden = !mensaje;
  }

  function ponerEnviando(activo) {
    enviando = activo;
    boton.disabled = activo;
    boton.classList.toggle('boton--cargando', activo);
    boton.textContent = activo ? 'Enviando…' : 'Enviar registro';
    form.setAttribute('aria-busy', String(activo));
  }

  function mostrarConfirmacion(colaborador) {
    confirmacion.replaceChildren(
      h('h3', { class: 'confirmacion__titulo' }, '¡Registro recibido!'),
      h('p', {}, `Gracias, ${colaborador.nombre_completo}. Guardamos tus datos y te contactaremos en `,
        h('strong', {}, colaborador.email), '.'),
      h('button', { class: 'boton boton--secundario', type: 'button', onClick: reiniciar }, 'Registrar a otra persona'),
    );
    form.hidden = true;
    confirmacion.hidden = false;
    confirmacion.focus();
  }

  function reiniciar() {
    form.reset();
    CAMPOS.forEach((c) => actualizarContador(c.nombre));
    tocados.clear();
    intentoEnvio = false;
    CAMPOS.forEach((c) => pintar(c.nombre, null));
    mostrarAlerta(null);
    anuncio.textContent = '';
    confirmacion.hidden = true;
    form.hidden = false;
    controles[CAMPOS[0].nombre].input.focus();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;
    intentoEnvio = true;
    mostrarAlerta(null);

    pendientes.clear();
    const datos = leer();
    const errores = erroresPorCampo(datos);
    CAMPOS.forEach((c) => pintar(c.nombre, errores[c.nombre]));
    const invalidos = CAMPOS.filter((c) => errores[c.nombre]);
    if (invalidos.length) {
      anuncio.textContent = invalidos.length === 1 ? 'Revisa el campo marcado.' : `Revisa los ${invalidos.length} campos marcados.`;
      controles[invalidos[0].nombre].input.focus();
      return;
    }

    ponerEnviando(true);
    try {
      const colaborador = await api.createColaborador(datos);
      ponerEnviando(false);
      mostrarConfirmacion(colaborador);
    } catch (err) {
      ponerEnviando(false);
      if (err instanceof ApiError && err.codigo === 'VALIDACION') {
        for (const d of err.detalles ?? []) if (controles[d.campo]) pintar(d.campo, d.mensaje);
        const primero = (err.detalles ?? []).find((d) => controles[d.campo]);
        if (primero) controles[primero.campo].input.focus();
        else mostrarAlerta(err.message);
      } else {
        console.error(err);
        mostrarAlerta(err instanceof ApiError ? err.message : 'No se pudo enviar tu registro. Intenta de nuevo.');
      }
    }
  });

  return contenedor;
}
