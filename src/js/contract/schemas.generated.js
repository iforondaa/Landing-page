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
  "comentario.schema.json": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "comentario.schema.json",
    "title": "Comentario",
    "description": "Comentario persistido al pie de una publicación. `id` y `fecha_creacion` los asigna la capa de persistencia.",
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
    "description": "Publicación institucional. En V1 se carga desde un archivo semilla; solo una puede tener `es_principal = true`.",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "id",
      "titulo",
      "resumen",
      "cuerpo",
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
        "description": "Resumen que se muestra en el hero."
      },
      "cuerpo": {
        "type": "string",
        "minLength": 1,
        "description": "Texto completo; los párrafos se separan con una línea en blanco."
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
      "es_principal": {
        "type": "boolean",
        "description": "Indica si es la publicación principal del hero."
      }
    },
    "examples": [
      {
        "id": "7d2e4f60-1a3b-4c5d-8e9f-0a1b2c3d4e5f",
        "titulo": "Título de ejemplo de la publicación principal",
        "resumen": "Resumen breve que aparece en la sección superior de la landing.",
        "cuerpo": "Primer párrafo de la nota.\n\nSegundo párrafo de la nota.",
        "autor": "Comunicación Institucional",
        "fecha_publicacion": "2026-09-30T12:00:00.000Z",
        "imagen_url": "assets/img/publicacion-principal.jpg",
        "es_principal": true
      }
    ]
  }
};
