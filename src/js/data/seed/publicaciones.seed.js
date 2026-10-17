/**
 * Publicaciones (V1 sin CMS). Deben cumplir spec/schemas/publicacion.schema.json (contrato 2.0.0);
 * el adaptador las valida al arrancar.
 *
 * Fuente de la publicación principal:
 *  - Carátula: «Resumen ejecutivo – Encuesta Banobras» (los resultados en un vistazo).
 *  - Contenido: «Informe de análisis ejecutivo» completo.
 * Versión definitiva: «…_revision_consistencia.docx» (carpeta «versión definitiva», 2026-10-16).
 * Las gráficas se guardan como datos (no como imágenes) para dibujarlas con la paleta del sitio.
 */

const N96 = 'Base: 96 respuestas.';

export const publicaciones = [
  {
    id: '7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
    antetitulo: 'Consulta a las y los trabajadores sindicalizados de Banobras',
    titulo: 'El Sindicato visto por su base',
    resumen: 'Resultados de la consulta aplicada del 10 de agosto al 17 de septiembre de 2026 (96 respuestas): más de la mitad siente al Sindicato ausente, pero casi nueve de cada diez quieren que intervenga y tres de cada cuatro están dispuestos a participar.',
    autor: 'Iván Foronda',
    fecha_publicacion: '2026-10-19T16:00:00.000Z', // 19 de octubre de 2026, 10:00 h (Ciudad de México)
    imagen_url: 'assets/img/consulta-portada.svg',
    imagen_alt: 'Portada: ¿Qué tan presente has sentido al Sindicato? El 52% lo siente casi ausente (44%) o totalmente ausente (8%); el 48% lo siente algo presente (38%) o muy presente (10%). Gráfica de dona con base en 96 respuestas.',
    es_principal: true,

    caratula: {
      titulo: 'Los resultados de la consulta en un vistazo',
      subtitulo: '96 respuestas · 10 de agosto – 17 de septiembre de 2026 · 10 preguntas, levantamiento en línea',
      cifras: [
        { valor: '48%', texto: 'siente al Sindicato **muy presente o algo presente** mientras el **52%** lo siente **totalmente ausente o casi ausente**.' },
        { valor: '89%', texto: 'quiere que el Sindicato **intervenga** ante un problema con un superior: como mediador o como asesor' },
        { valor: '77%', texto: 'está dispuesto a **participar** en reuniones, mesas de trabajo o consultas' },
      ],
      graficas: [
        {
          variante: 'dona',
          titulo: '¿Qué tan presente has sentido al Sindicato?',
          nota: 'Información, reuniones, acompañamiento · n=96',
          datos: [
            { etiqueta: 'Muy presente, con comunicación y acompañamiento constante', valores: [10], tono: 'positivo-fuerte' },
            { etiqueta: 'Algo presente, pero con poca interacción directa', valores: [38], tono: 'positivo' },
            { etiqueta: 'Casi ausente, solo aparece en momentos puntuales', valores: [44], tono: 'negativo' },
            { etiqueta: 'Totalmente ausente, no he tenido contacto', valores: [8], tono: 'negativo-fuerte' },
          ],
        },
        {
          variante: 'barras',
          titulo: 'La imagen del Sindicato en tu área de trabajo',
          nota: 'n=96',
          datos: [
            { etiqueta: 'Es tolerado pero no influyente', valores: [44] },
            { etiqueta: 'No se habla del Sindicato', valores: [29] },
            { etiqueta: 'Es respetado y tomado en cuenta', valores: [19] },
            { etiqueta: 'Es visto como un obstáculo', valores: [8] },
          ],
        },
        {
          variante: 'barras',
          titulo: 'Lo que más se valora',
          nota: '% que la coloca entre sus tres prestaciones más importantes · n=96',
          datos: [
            { etiqueta: 'Servicio médico', valores: [85] },
            { etiqueta: 'Préstamos (PEA, hipotecarios, personales)', valores: [71] },
            { etiqueta: 'Prestaciones económicas (aguinaldo, fondo de ahorro)', valores: [52] },
            { etiqueta: 'Estabilidad laboral (ser de base)', valores: [46] },
            { etiqueta: 'Plan de pensiones y jubilación', valores: [42] },
          ],
        },
        {
          variante: 'barras',
          titulo: 'La prioridad que se le pide al próximo Comité Ejecutivo Nacional',
          nota: '% de respuestas en pregunta abierta, clasificadas por tema principal · 5 temas principales · n=84',
          datos: [
            { etiqueta: 'PTU / reparto de utilidades', valores: [33] },
            { etiqueta: 'Defensa de derechos y prestaciones', valores: [15] },
            { etiqueta: 'Presencia y comunicación con la base', valores: [12] },
            { etiqueta: 'Reconocimiento de la afiliación y cuotas', valores: [10] },
            { etiqueta: 'Servicio médico', valores: [8] },
          ],
        },
      ],
      destacado: {
        titulo: 'Falta difusión de casos exitosos',
        valor: '17 de 96',
        texto: 'personas (18%) describieron que el Sindicato intervino exitosamente en despidos revertidos, horarios de lactancia y mediación por acoso, mientras el resto no respondió o dijo no conocer ningún caso.',
      },
      cita: {
        texto: 'No conozco ninguna situación en la que el sindicato haya resuelto algún conflicto. Si es que hubiere alguno, deberían compartirse los alcances que ha tenido el Sindicato.',
        fuente: 'Respuesta abierta, pregunta 6',
      },
      nota: 'Encuesta aplicada en línea entre trabajadoras y trabajadores sindicalizados de Banobras. 96 respuestas recibidas entre el 10 de agosto y el 17 de septiembre de 2026. Los porcentajes se calculan sobre el total de respuestas de cada pregunta y pueden no sumar 100% por redondeo. Las respuestas abiertas se clasificaron por su tema principal.',
    },

    contenido: [
      { tipo: 'seccion', texto: '1. Lo esencial en cinco puntos' },
      {
        tipo: 'lista',
        elementos: [
          '**No hay rechazo al Sindicato: hay ausencia.** Más de la mitad de la base sindicalizada, el 52%, siente al Sindicato totalmente ausente o casi ausente en los últimos años. Mientras que el 48% lo siente muy presente o algo presente.',
          '**La demanda de Sindicato es alta, no baja.** 89% quiere que el Sindicato intervenga como mediador (58%) o que lo asesore (31%) ante un problema con un superior. Apenas 11% preferiría resolverlo sin él. La base no pide menos Sindicato: pide uno presente.',
          '**El trabajo hecho es invisible.** Solo 18% pudo mencionar un caso concreto en el que el Sindicato haya resuelto una situación laboral; 82% no respondió o respondió explícitamente que no conoce ninguno. La falta de difusión de los casos exitosos —más que los casos perdidos— es una oportunidad que puede aprovechar el Sindicato para reivindicarse.',
          '**La agenda material está concentrada y es nombrable.** El reparto de utilidades (PTU) domina las prioridades espontáneas con 33% de las menciones, seguido de la defensa de derechos y prestaciones (15%) y la presencia y cercanía del propio Sindicato (12%). En paralelo, el servicio médico es la prestación más valorada: 85% la coloca entre sus tres más importantes y 49% en primer lugar.',
          '**Hay disposición a participar, y hay que capitalizarla pronto.** 77% se declara abierto a participar en mesas de trabajo, consultas o encuestas; 34% lo afirma sin condiciones. La base trabajadora quiere participar si hay temas concretos y resultados visibles, pero no está siendo convocada.',
        ],
      },

      { tipo: 'seccion', texto: '2. Quiénes respondieron' },
      { tipo: 'parrafo', texto: 'Buena parte de quienes responden se incorporó en la última década y no tiene memoria directa de logros anteriores, mientras el grupo de mayor antigüedad es el que sostiene la narrativa de prestaciones perdidas y por recuperar.' },
      {
        tipo: 'grafica',
        grafica: {
          variante: 'apilada',
          titulo: 'Antigüedad de quienes respondieron',
          datos: [
            { etiqueta: 'Menos de 5 años', valores: [27] },
            { etiqueta: 'De 5 a 10 años', valores: [45] },
            { etiqueta: 'De 11 a 20 años', valores: [14] },
            { etiqueta: 'Más de 20 años', valores: [14] },
          ],
        },
      },

      { tipo: 'seccion', texto: '3. La relación con el Sindicato hoy: distancia, no hostilidad' },
      { tipo: 'subseccion', texto: 'Percepción de presencia e imagen' },
      { tipo: 'parrafo', texto: 'La percepción es dividida, pues el 52% de los trabajadores lo consideran **casi ausente o totalmente ausente**, mientras que el 48% lo consideran **algo presente o muy presente**.' },
      {
        tipo: 'grafica',
        grafica: {
          variante: 'barras',
          titulo: '¿Qué tan presente has sentido al Sindicato?',
          nota: N96,
          datos: [
            { etiqueta: 'Muy presente, con comunicación y acompañamiento constante', valores: [10], tono: 'positivo-fuerte' },
            { etiqueta: 'Algo presente, pero con poca interacción directa', valores: [38], tono: 'positivo' },
            { etiqueta: 'Casi ausente, solo aparece en momentos puntuales', valores: [44], tono: 'negativo' },
            { etiqueta: 'Totalmente ausente, no he tenido contacto', valores: [8], tono: 'negativo-fuerte' },
          ],
        },
      },
      { tipo: 'parrafo', texto: 'La imagen en el lugar de trabajo confirma el diagnóstico: falta mayor presencia del Sindicato. Pues un 44% señala que el Sindicato “es tolerado pero no influyente”. Es decir que reconocen la tolerancia que se tiene al mismo, lo cual es positivo, al tiempo que se reconoce que hace falta valer su influencia con presencia y acciones. Mientras que el 29% manifiesta directamente que “no se habla” de él y solo 8% manifiesta que es visto como un obstáculo. Es decir, por cada persona que lo percibe como obstáculo hay más de dos que lo consideran respetado, y casi seis que manifiestan la relevante tolerancia al mismo.' },
      {
        tipo: 'grafica',
        grafica: {
          variante: 'barras',
          titulo: 'La imagen del Sindicato en tu área de trabajo',
          nota: N96,
          datos: [
            { etiqueta: 'Es respetado y tomado en cuenta', valores: [19] },
            { etiqueta: 'Es tolerado pero no influyente', valores: [44] },
            { etiqueta: 'No se habla del Sindicato', valores: [29] },
            { etiqueta: 'Es visto como un obstáculo', valores: [8] },
          ],
        },
      },
      { tipo: 'parrafo', texto: 'Este patrón —baja hostilidad y baja influencia— es, estratégicamente, una buena noticia: **no hay que revertir una imagen negativa, hay que fortalecer una imagen existente.** El costo de entrada de una estrategia de presencia es mucho menor que el de una de reparación reputacional.' },
      { tipo: 'citas', citas: [{ texto: 'Desde que llegué a la Institución, no hay Sindicato. Su presencia con el personal es nula.' }] },

      { tipo: 'seccion', texto: '4. Qué se espera del Sindicato' },
      { tipo: 'subseccion', texto: 'Papel esperado y situaciones de uso' },
      { tipo: 'parrafo', texto: 'Frente a un conflicto con un superior, 58% prefiere que el Sindicato intervenga como mediador y 31% que lo asesore para resolverlo por su cuenta: 89% le asigna algún papel activo. Solo 11% preferiría mantenerlo al margen. La expectativa dominante no es la de un Sindicato confrontativo ni la de uno decorativo, sino la de un **mediador técnico y confiable.**' },
      { tipo: 'parrafo', texto: 'Cuando se pregunta abiertamente **en qué situaciones recurrirían al Sindicato**, las respuestas se concentran en el terreno de la protección: 26% menciona el despido o la baja injustificada, 24% la defensa de derechos laborales en general y 15% los conflictos con superiores y el acoso laboral. Un 9% no acudiría en ninguna situación, por desconfianza o por experiencias previas sin resultado.' },
      {
        tipo: 'grafica',
        grafica: {
          variante: 'barras',
          titulo: '¿En qué situaciones recurrirías al Sindicato?',
          nota: 'Base: 85 respuestas abiertas, clasificadas por tema principal.',
          datos: [
            { etiqueta: 'Despido o baja injustificada', valores: [26] },
            { etiqueta: 'Defensa de derechos laborales', valores: [24] },
            { etiqueta: 'Conflicto con superiores / acoso laboral', valores: [15] },
            { etiqueta: 'En ninguna / desconfianza', valores: [9] },
            { etiqueta: 'Asesoría y orientación', valores: [9] },
            { etiqueta: 'Prestaciones y utilidades', valores: [7] },
            { etiqueta: 'Servicio médico', valores: [6] },
            { etiqueta: 'Promoción y salario', valores: [4] },
          ],
        },
      },
      { tipo: 'subseccion', texto: 'El déficit de casos conocidos' },
      { tipo: 'parrafo', texto: 'El hallazgo más incómodo de la consulta está en la pregunta por casos concretos. **De las 96 personas participantes, 79 no respondieron o dijeron no conocer ninguna situación resuelta por el Sindicato**; solo 17 —18% del total de participantes— pudieron narrar un caso resuelto por el Sindicato. Y los que sí existen son elocuentes: reinstalaciones tras despidos, reubicaciones de compañeras en riesgo de baja, horarios de lactancia respetados, mediación en acoso laboral, autorizaciones médicas destrabadas. Son victorias reales que pocos conocen.' },
      {
        tipo: 'citas',
        citas: [
          { texto: 'Supe de un despido injustificado y lograron la incorporación en su lugar de trabajo; fue tardado pero lo lograron: funcionó la constancia.' },
          { texto: 'No conozco ninguna situación en la que el sindicato haya resuelto algún conflicto. Si es que hubiere alguno, deberían compartirse los alcances que ha tenido el Sindicato.' },
        ],
      },
      { tipo: 'parrafo', texto: '**Implicación directa:** existe un activo de legitimidad ya ganado que no está siendo comunicado. Documentar y difundir los casos resueltos es la intervención de menor costo y mayor rendimiento disponible en el corto plazo.' },

      { tipo: 'seccion', texto: '5. La agenda material: qué se valora y qué se teme perder' },
      { tipo: 'parrafo', texto: 'La jerarquización de prestaciones deja un ganador indiscutible. El servicio médico familiar aparece en las tres primeras posiciones de 85% de las personas y encabeza la lista de 49%, muy por encima de cualquier otra prestación. Le siguen los préstamos (PEA, hipotecarios y personales), mencionados por 71%, las prestaciones económicas (aguinaldo y fondo de ahorro), por 52%, y la estabilidad laboral de ser de base, que aunque es citada por 46%, concentra un alto porcentaje de primeras menciones (23%): para quien la elige, no es negociable.' },
      {
        tipo: 'grafica',
        grafica: {
          variante: 'barras-agrupadas',
          titulo: 'Las prestaciones más valoradas',
          nota: 'Base: 96 respuestas. Pregunta de jerarquización (1º, 2º y 3º lugar).',
          series: ['La menciona entre sus tres', 'La coloca en primer lugar'],
          datos: [
            { etiqueta: 'Servicio médico', valores: [85, 49] },
            { etiqueta: 'Préstamos (PEA, hipotecarios, personales)', valores: [71, 15] },
            { etiqueta: 'Prestaciones económicas (aguinaldo, fondo de ahorro)', valores: [52, 4] },
            { etiqueta: 'Estabilidad laboral (ser de base)', valores: [46, 23] },
            { etiqueta: 'Pensiones y jubilación', valores: [42, 9] },
          ],
        },
      },
      { tipo: 'parrafo', texto: 'En las respuestas abiertas sobre los **principales retos**, el eje ordenador es la palabra **conservar**. Un bloque de 14% apunta al propio Sindicato: su presencia, su transparencia y, señaladamente, el reconocimiento pleno de las personas afiliadas.' },
      {
        tipo: 'grafica',
        grafica: {
          variante: 'barras',
          titulo: 'Los principales retos',
          nota: 'Base: 80 respuestas abiertas, clasificadas por tema principal.',
          datos: [
            { etiqueta: 'Conservar y recuperar prestaciones', valores: [22] },
            { etiqueta: 'Estabilidad y certidumbre', valores: [18] },
            { etiqueta: 'Derechos, acoso y trato justo', valores: [15] },
            { etiqueta: 'Condiciones de trabajo', valores: [14] },
            { etiqueta: 'Presencia y reconocimiento sindical', valores: [14] },
            { etiqueta: 'Desarrollo profesional y salario', valores: [10] },
            { etiqueta: 'Servicio médico', valores: [7] },
          ],
        },
      },
      {
        tipo: 'citas',
        citas: [
          { texto: 'La reducción de prestaciones y el miedo a seguirlas perdiendo.' },
          { texto: 'Revertir el deterioro del servicio médico: paulatinamente se reduce el padrón de especialistas, hospitales y farmacias; cada cambio de aseguradora marca un retroceso.' },
        ],
      },

      { tipo: 'seccion', texto: '6. La prioridad para el próximo Comité Ejecutivo Nacional' },
      { tipo: 'parrafo', texto: 'Sin opciones predefinidas, 84 personas escribieron qué debería defender, mejorar o impulsar el próximo Comité. Un tercio exacto de esas respuestas (33%) nombra el reparto de utilidades: la PTU, y en particular el pago pendiente de 2019, es el tema que más se repite y el que aparece con mayor carga emocional, asociado a un agravio comparativo —“a unos sí y a otros no”— y a la falta de información sobre su estatus.' },
      {
        tipo: 'grafica',
        grafica: {
          variante: 'barras',
          titulo: 'La prioridad para el próximo Comité Ejecutivo Nacional',
          nota: 'Base: 84 respuestas abiertas, clasificadas por tema principal.',
          datos: [
            { etiqueta: 'Utilidades (PTU)', valores: [33] },
            { etiqueta: 'Defensa de derechos', valores: [15] },
            { etiqueta: 'Presencia y cercanía', valores: [12] },
            { etiqueta: 'Reconocimiento sindical', valores: [10] },
            { etiqueta: 'Servicio médico', valores: [8] },
            { etiqueta: 'Desarrollo y salario', valores: [8] },
            { etiqueta: 'Condiciones laborales', valores: [7] },
            { etiqueta: 'Pensiones y jubilación', valores: [4] },
            { etiqueta: 'Estabilidad laboral', valores: [3] },
          ],
        },
      },
      { tipo: 'parrafo', texto: 'Detrás de la PTU se ordenan tres demandas de naturaleza distinta. La primera es **programática**: defensa de derechos y prestaciones (15%), servicio médico (8%) y desarrollo profesional, salario y escalafón (8%). La segunda es **organizativa**: presencia, comunicación y cercanía (12%). La tercera, y quizá la más **estructural**, es de supervivencia institucional: 10% pide que Banobras reconozca formalmente a las personas afiliadas y aplique el descuento de cuotas sindicales, un reclamo que varios respondientes vinculan explícitamente con la viabilidad futura del Sindicato.' },
      {
        tipo: 'citas',
        citas: [
          { texto: 'El sindicato, sin sindicalizados, está a pocos años de desaparecer.' },
          { texto: 'Que realmente defienda nuestros derechos y no se deje manipular; ha decaído mucho su papel como sindicato.' },
        ],
      },

      { tipo: 'seccion', texto: '7. Una base dispuesta a participar' },
      { tipo: 'parrafo', texto: 'La consulta cierra con un dato que conviene no desperdiciar. Un 34% quiere participar en futuras reuniones y mesas de trabajo sin condiciones, 24% lo haría dependiendo del tema y 19% prefiere hacerlo por la vía de encuestas y consultas. En conjunto, 77% está disponible en algún formato. Solo 16% descarta participar por ahora y 7% pide más información antes de decidir.' },
      {
        tipo: 'grafica',
        grafica: {
          variante: 'barras',
          titulo: 'Disposición a participar',
          nota: N96,
          datos: [
            { etiqueta: 'Sí, me gustaría participar', valores: [34] },
            { etiqueta: 'Tal vez, dependiendo del tema', valores: [24] },
            { etiqueta: 'Prefiero participar mediante encuestas o consultas', valores: [19] },
            { etiqueta: 'Me gustaría recibir más información antes de decidir', valores: [7] },
            { etiqueta: 'Por ahora no', valores: [16] },
          ],
        },
      },
      { tipo: 'parrafo', texto: 'La disposición, sin embargo, es condicional en el fondo aunque no lo parezca en la forma: quienes responden piden temas concretos, convocatorias claras y resultados visibles.' },

      { tipo: 'seccion', texto: '8. Conclusiones y línea de acción' },
      {
        tipo: 'lista',
        elementos: [
          '**Presencia antes que discurso.** El déficit principal es de contacto, no de legitimidad. Delegados por dirección y en oficinas de promoción, calendario visible de visitas y un canal de atención identificable atienden el hallazgo central de la consulta.',
          '**Hacer visible lo ya logrado.** Un registro público de casos atendidos y resueltos —anonimizado— convierte un activo invisible en autoridad. Es la acción de mayor rendimiento inmediato.',
          '**Una bandera clara y medible: la PTU.** Informar con transparencia el estatus del pago de 2019 y fijar una ruta con fechas. En este tema la desinformación ya está haciendo más daño que el propio resultado.',
          '**Blindar el servicio médico.** Es la prestación más valorada y aquella sobre la que se concentran testimonios de deterioro: cualquier agenda de defensa de prestaciones debe empezar ahí.',
          '**Resolver el reconocimiento de la afiliación.** Es un asunto de derechos individuales y, simultáneamente, de viabilidad del propio Sindicato. Los respondientes ya lo formulan en esos términos.',
        ],
      },
    ],
  },
];
