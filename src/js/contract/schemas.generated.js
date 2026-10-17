// ARCHIVO GENERADO — NO EDITAR A MANO.
// Fuente: spec/schemas/*.schema.json · Regenerar con: npm run gen:schemas

export const schemas = {
  "colaborador.input.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "colaborador.input.schema.json",
    "title": "ColaboradorInput",
    "description": "Datos que envía el formulario \"Quiero colaborar\". Antes de validar, la capa de datos recorta espacios y omite los campos opcionales vacíos.",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "nombre_completo",
      "email"
    ],
    "properties": {
      "nombre_completo": {
        "$ref": "colaborador.schema.json#/properties/nombre_completo"
      },
      "email": {
        "$ref": "colaborador.schema.json#/properties/email"
      },
      "telefono": {
        "$ref": "colaborador.schema.json#/properties/telefono"
      },
      "area_adscripcion": {
        "$ref": "colaborador.schema.json#/properties/area_adscripcion"
      },
      "comentario_propuesta": {
        "$ref": "colaborador.schema.json#/properties/comentario_propuesta"
      }
    },
    "examples": [
      {
        "nombre_completo": "Antonio Machado Ruiz",
        "email": "ejemplo@banobras.gob.mx"
      }
    ]
  },
  "colaborador.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "colaborador.schema.json",
    "title": "Colaborador",
    "description": "Registro persistido de una persona que desea colaborar. `id` y `fecha_registro` los asigna la capa de persistencia.",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "nombre_completo",
      "email",
      "fecha_registro"
    ],
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "description": "Identificador único (UUID v4)."
      },
      "nombre_completo": {
        "type": "string",
        "minLength": 2,
        "maxLength": 120,
        "pattern": "^\\S(?:.*\\S)?$",
        "description": "Nombre completo, sin espacios al inicio ni al final."
      },
      "email": {
        "type": "string",
        "format": "email",
        "maxLength": 254,
        "description": "Correo electrónico. Se acepta cualquier dominio."
      },
      "telefono": {
        "type": "string",
        "pattern": "^\\d(?:-?\\d){9}$",
        "description": "Teléfono de 10 dígitos; admite guiones entre dígitos en cualquier posición (ej. 5543650920, 55-4365-0920, 554-365-0920)."
      },
      "area_adscripcion": {
        "type": "string",
        "minLength": 1,
        "maxLength": 120,
        "description": "Área de adscripción."
      },
      "comentario_propuesta": {
        "type": "string",
        "minLength": 1,
        "maxLength": 2000,
        "description": "Comentario o propuesta opcional de la persona."
      },
      "fecha_registro": {
        "type": "string",
        "format": "date-time",
        "description": "Fecha y hora de registro (ISO 8601, UTC)."
      }
    },
    "examples": [
      {
        "id": "3f6c2a1e-8b4d-4c2a-9e1f-5a7b8c9d0e1f",
        "nombre_completo": "Antonio Machado Ruiz",
        "email": "ejemplo@banobras.gob.mx",
        "telefono": "55-4365-0920",
        "area_adscripcion": "Dirección de Crédito",
        "comentario_propuesta": "Propongo organizar pláticas sobre prestaciones laborales.",
        "fecha_registro": "2026-09-30T18:00:00.000Z"
      }
    ]
  },
  "comentario.input.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "comentario.input.schema.json",
    "title": "ComentarioInput",
    "description": "Datos que envía el formulario de comentarios. `autor` es opcional; vacío o solo espacios equivale a omitirlo.",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "contenido"
    ],
    "properties": {
      "autor": {
        "type": "string",
        "maxLength": 120,
        "description": "Nombre opcional del autor."
      },
      "contenido": {
        "$ref": "comentario.schema.json#/properties/contenido"
      }
    },
    "examples": [
      {
        "contenido": "Excelente nota, muy clara."
      }
    ]
  },
  "comentario.moderacion.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "comentario.moderacion.schema.json",
    "title": "ModeracionComentario",
    "description": "Cuerpo para ocultar o volver a mostrar un comentario (solo administración).",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "oculto"
    ],
    "properties": {
      "oculto": {
        "type": "boolean",
        "description": "`true` lo oculta al público; `false` lo vuelve a mostrar."
      }
    },
    "examples": [
      {
        "oculto": true
      }
    ]
  },
  "comentario.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "comentario.schema.json",
    "title": "Comentario",
    "description": "Comentario persistido al pie de una publicación. `id`, `fecha_creacion` y `oculto` los asigna la capa de persistencia.",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "publicacion_id",
      "autor",
      "contenido",
      "fecha_creacion"
    ],
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "description": "Identificador único (UUID v4)."
      },
      "publicacion_id": {
        "type": "string",
        "format": "uuid",
        "description": "Publicación a la que pertenece el comentario."
      },
      "autor": {
        "type": "string",
        "minLength": 1,
        "maxLength": 120,
        "default": "Anónimo",
        "description": "Nombre del autor. Si se omite o viene vacío se guarda \"Anónimo\"."
      },
      "contenido": {
        "type": "string",
        "minLength": 1,
        "maxLength": 2000,
        "pattern": "^\\S(?:[\\s\\S]*\\S)?$",
        "description": "Texto del comentario, sin espacios al inicio ni al final."
      },
      "fecha_creacion": {
        "type": "string",
        "format": "date-time",
        "description": "Fecha y hora de creación (ISO 8601, UTC)."
      },
      "oculto": {
        "type": "boolean",
        "default": false,
        "description": "Solo en la vista de administración: `true` si quien administra lo ocultó. Los comentarios ocultos no se devuelven al público."
      }
    },
    "examples": [
      {
        "id": "9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d",
        "publicacion_id": "7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f",
        "autor": "Anónimo",
        "contenido": "Excelente nota, muy clara.",
        "fecha_creacion": "2026-09-30T18:05:00.000Z"
      }
    ]
  },
  "error.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "error.schema.json",
    "title": "Error",
    "description": "Respuesta de error uniforme de la capa de datos.",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "codigo",
      "mensaje"
    ],
    "properties": {
      "codigo": {
        "type": "string",
        "enum": [
          "VALIDACION",
          "NO_AUTORIZADO",
          "NO_ENCONTRADO",
          "ALMACENAMIENTO"
        ],
        "description": "Código de error legible por máquina."
      },
      "mensaje": {
        "type": "string",
        "description": "Mensaje para mostrar al usuario."
      },
      "detalles": {
        "type": "array",
        "description": "Errores por campo (solo para VALIDACION).",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "campo",
            "mensaje"
          ],
          "properties": {
            "campo": {
              "type": "string",
              "description": "Nombre del campo."
            },
            "mensaje": {
              "type": "string",
              "description": "Descripción del error."
            }
          }
        }
      }
    },
    "examples": [
      {
        "codigo": "VALIDACION",
        "mensaje": "Revisa los campos marcados.",
        "detalles": [
          {
            "campo": "email",
            "mensaje": "Formato de correo no válido."
          }
        ]
      }
    ]
  },
  "publicacion.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "publicacion.schema.json",
    "title": "Publicacion",
    "description": "Publicación (contrato 2.0.0). El texto largo va en `contenido` (bloques tipificados) y el resumen visual en `caratula`; `cuerpo` (texto simple) queda como alternativa. Reglas de negocio que valida la capa de datos: debe existir `cuerpo` o `contenido`; si hay `imagen_url`, `imagen_alt` es obligatorio; solo una publicación con `es_principal = true`.",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "titulo",
      "resumen",
      "autor",
      "fecha_publicacion",
      "es_principal"
    ],
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "description": "Identificador único (UUID v4)."
      },
      "antetitulo": {
        "type": "string",
        "minLength": 1,
        "maxLength": 160,
        "description": "Texto breve sobre el título (contexto de la nota)."
      },
      "titulo": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200,
        "description": "Título de la nota."
      },
      "resumen": {
        "type": "string",
        "minLength": 1,
        "maxLength": 400,
        "description": "Resumen que se muestra en la portada del sitio."
      },
      "cuerpo": {
        "type": "string",
        "minLength": 1,
        "description": "Texto simple (alternativa a `contenido`); párrafos separados por línea en blanco."
      },
      "autor": {
        "type": "string",
        "minLength": 1,
        "maxLength": 120,
        "description": "Autor o área que firma la nota."
      },
      "fecha_publicacion": {
        "type": "string",
        "format": "date-time",
        "description": "Fecha de publicación (ISO 8601)."
      },
      "imagen_url": {
        "type": "string",
        "format": "uri-reference",
        "description": "Imagen de portada (ruta relativa o URL)."
      },
      "imagen_alt": {
        "type": "string",
        "minLength": 1,
        "maxLength": 600,
        "description": "Texto alternativo de la imagen de portada (obligatorio si hay imagen)."
      },
      "es_principal": {
        "type": "boolean",
        "description": "Indica si es la publicación principal."
      },
      "caratula": {
        "$ref": "#/$defs/caratula"
      },
      "contenido": {
        "type": "array",
        "items": {
          "$ref": "#/$defs/bloque"
        },
        "description": "Cuerpo de la nota en bloques tipificados."
      }
    },
    "$defs": {
      "texto_enriquecido": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000,
        "description": "Texto que admite **negritas** (doble asterisco). Nunca se interpreta como HTML."
      },
      "cifra": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "valor",
          "texto"
        ],
        "properties": {
          "valor": {
            "type": "string",
            "minLength": 1,
            "maxLength": 20,
            "description": "Cifra destacada, ej. «48%»."
          },
          "texto": {
            "$ref": "#/$defs/texto_enriquecido"
          }
        }
      },
      "dato": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "etiqueta",
          "valores"
        ],
        "properties": {
          "etiqueta": {
            "type": "string",
            "minLength": 1,
            "maxLength": 160
          },
          "valores": {
            "type": "array",
            "items": {
              "type": "number",
              "minimum": 0
            },
            "description": "Un valor por serie (en `barras` y `dona`, uno solo)."
          },
          "tono": {
            "type": "string",
            "enum": [
              "negativo-fuerte",
              "negativo",
              "positivo",
              "positivo-fuerte"
            ],
            "description": "Polaridad para escalas divergentes (ausente ↔ presente)."
          }
        }
      },
      "grafica": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "variante",
          "titulo",
          "datos"
        ],
        "properties": {
          "variante": {
            "type": "string",
            "enum": [
              "barras",
              "barras-agrupadas",
              "apilada",
              "dona"
            ]
          },
          "titulo": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "nota": {
            "type": "string",
            "minLength": 1,
            "maxLength": 300,
            "description": "Base y aclaraciones, ej. «Base: 96 respuestas.»"
          },
          "unidad": {
            "type": "string",
            "enum": [
              "%",
              "menciones"
            ],
            "description": "Unidad de los valores (por omisión, %)."
          },
          "series": {
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 80
            },
            "description": "Nombres de las series (en `barras-agrupadas`)."
          },
          "datos": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/dato"
            }
          }
        }
      },
      "cita": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "texto"
        ],
        "properties": {
          "texto": {
            "type": "string",
            "minLength": 1,
            "maxLength": 1200
          },
          "fuente": {
            "type": "string",
            "minLength": 1,
            "maxLength": 160
          }
        }
      },
      "destacado": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "titulo",
          "valor",
          "texto"
        ],
        "properties": {
          "titulo": {
            "type": "string",
            "minLength": 1,
            "maxLength": 160
          },
          "valor": {
            "type": "string",
            "minLength": 1,
            "maxLength": 30
          },
          "texto": {
            "$ref": "#/$defs/texto_enriquecido"
          }
        }
      },
      "caratula": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "titulo"
        ],
        "description": "Resumen visual al inicio de la nota («de un vistazo»).",
        "properties": {
          "titulo": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "subtitulo": {
            "type": "string",
            "minLength": 1,
            "maxLength": 300
          },
          "cifras": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/cifra"
            }
          },
          "graficas": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/grafica"
            }
          },
          "destacado": {
            "$ref": "#/$defs/destacado"
          },
          "cita": {
            "$ref": "#/$defs/cita"
          },
          "nota": {
            "type": "string",
            "minLength": 1,
            "maxLength": 800
          }
        }
      },
      "bloque": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "tipo"
        ],
        "description": "Bloque del contenido. Campos según `tipo`: seccion/subseccion/parrafo → `texto`; lista → `elementos`; citas → `citas`; grafica → `grafica`.",
        "properties": {
          "tipo": {
            "type": "string",
            "enum": [
              "seccion",
              "subseccion",
              "parrafo",
              "lista",
              "citas",
              "grafica"
            ]
          },
          "texto": {
            "$ref": "#/$defs/texto_enriquecido"
          },
          "elementos": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/texto_enriquecido"
            }
          },
          "citas": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/cita"
            }
          },
          "grafica": {
            "$ref": "#/$defs/grafica"
          }
        }
      }
    },
    "examples": [
      {
        "id": "7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f",
        "antetitulo": "Consulta a la base sindicalizada",
        "titulo": "Título de ejemplo de la publicación principal",
        "resumen": "Resumen breve que aparece en la portada del sitio.",
        "autor": "Iván Foronda",
        "fecha_publicacion": "2026-10-19T16:00:00.000Z",
        "imagen_url": "assets/img/portada.svg",
        "imagen_alt": "Gráfica de dona con los resultados principales.",
        "es_principal": true,
        "caratula": {
          "titulo": "Los resultados en un vistazo",
          "subtitulo": "96 respuestas",
          "cifras": [
            {
              "valor": "48%",
              "texto": "siente al Sindicato **presente**"
            }
          ],
          "graficas": [
            {
              "variante": "dona",
              "titulo": "Presencia",
              "nota": "n=96",
              "datos": [
                {
                  "etiqueta": "Presente",
                  "valores": [
                    48
                  ],
                  "tono": "positivo"
                },
                {
                  "etiqueta": "Ausente",
                  "valores": [
                    52
                  ],
                  "tono": "negativo"
                }
              ]
            }
          ],
          "destacado": {
            "titulo": "Casos conocidos",
            "valor": "17",
            "texto": "personas narraron un caso."
          },
          "cita": {
            "texto": "Una cita de ejemplo.",
            "fuente": "Respuesta abierta"
          },
          "nota": "Nota metodológica."
        },
        "contenido": [
          {
            "tipo": "seccion",
            "texto": "1. Lo esencial"
          },
          {
            "tipo": "parrafo",
            "texto": "Párrafo con **negritas**."
          },
          {
            "tipo": "lista",
            "elementos": [
              "Uno",
              "Dos"
            ]
          },
          {
            "tipo": "citas",
            "citas": [
              {
                "texto": "Cita."
              }
            ]
          },
          {
            "tipo": "grafica",
            "grafica": {
              "variante": "barras-agrupadas",
              "titulo": "Prestaciones",
              "unidad": "%",
              "series": [
                "Entre sus tres",
                "Primer lugar"
              ],
              "datos": [
                {
                  "etiqueta": "Servicio médico",
                  "valores": [
                    85,
                    49
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  }
};
