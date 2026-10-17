import { api, sesion } from './data/api.js';
import { IDENTIDAD, aplicarIdentidad } from './identidad.js';
import { crearRouter } from './router.js';
import { marcarNavActivo, activarSaltoAlContenido } from './components/header.js';
import { vistaInicio } from './views/home.view.js';
import { vistaPublicacion } from './views/publicacion.view.js';
import { vistaAdmin } from './views/admin.view.js';
import { vistaNoEncontrada, vistaError } from './views/estado.view.js';

export const RUTAS = [
  { patron: '/', vista: vistaInicio },
  { patron: '/publicaciones', vista: vistaInicio, seccion: 'publicaciones', nav: 'publicaciones' },
  { patron: '/colaborar', vista: vistaInicio, seccion: 'colaborar', nav: 'colaborar' },
  { patron: '/publicacion/:id', vista: vistaPublicacion, nav: 'publicaciones' },
  { patron: '/admin', vista: vistaAdmin },
  { patron: '/admin/exportar', vista: vistaAdmin },
];

aplicarIdentidad();
activarSaltoAlContenido();

crearRouter({
  rutas: RUTAS,
  contenedor: document.getElementById('contenido'),
  contexto: { api, sesion },
  sitio: IDENTIDAD.nombre,
  vistaNoEncontrada,
  vistaError,
  alCambiar: ({ ruta }) => marcarNavActivo(ruta.nav ?? null),
}).iniciar();
