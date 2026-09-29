/**
 * config.js
 * ------------------------------------------------------------
 * Responsabilidad: constantes globales de la aplicación.
 *
 * Reglas:
 *  - Sin dependencias (se carga primero).
 *  - Sin lógica de negocio.
 *  - Sin acceso al DOM ni a fetch.
 *  - Congelado (Object.freeze) para evitar mutaciones accidentales.
 * ------------------------------------------------------------
 */

const CONFIG = Object.freeze({

    /* ----------------------------------------------------------
     * Identidad de la app
     * -------------------------------------------------------- */
    APP_NAME: 'HVAC Field Pro',
    VERSION:  '0.1.0',

    /* ----------------------------------------------------------
     * Modo de desarrollo
     * true  → usa datos mock (api.mock.js), sin backend
     * false → conecta con Apps Script real
     *
     * ⚠️ Poner en false ANTES de desplegar a producción.
     * -------------------------------------------------------- */
    USE_MOCK: false,

    /* ----------------------------------------------------------
     * Backend
     * Pega aquí la URL del Web App de Apps Script.
     * Formato esperado: https://script.google.com/macros/s/XXXX/exec
     * -------------------------------------------------------- */
    API_URL: 'https://script.google.com/macros/s/AKfycbyAN7RiXRbGTha_IuEmIq9J0SLby1lZzTXiyZw0NxPx1RPGDcS0fV01G6RuNFcSFR0a/exec',

    /* ----------------------------------------------------------
     * Claves de almacenamiento local (localStorage)
     * -------------------------------------------------------- */
    STORAGE_KEYS: Object.freeze({
        SESION: 'tecnicos_app_sesion'
    }),

    /* ----------------------------------------------------------
     * Rutas del router (basadas en hash)
     * -------------------------------------------------------- */
    ROUTES: Object.freeze({
    LOGIN:      '#/login',
    DASHBOARD:  '#/dashboard',
    CHECADOR:   '#/checador',
    EVIDENCIAS: '#/evidencias',
    SUPERVISOR: '#/supervisor'
}),
    /* ----------------------------------------------------------
     * Reglas de archivos (evidencias)
     * -------------------------------------------------------- */
    FILES: Object.freeze({
        MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
        MAX_FILES:      5,
        ALLOWED_EXTENSIONS: Object.freeze([
            'jpg', 'jpeg', 'png', 'webp', 'heic',
            'pdf', 'docx', 'xlsx'
        ]),
        ACCEPT_ATTR: 'image/jpeg,image/png,image/webp,image/heic,' +
                     'application/pdf,' +
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
                     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),

    /* ----------------------------------------------------------
     * Reglas de validación de campos de texto.
     * -------------------------------------------------------- */
    VALIDATION: Object.freeze({
        EMAIL_MAX_LENGTH:      100,
        COMENTARIO_MAX_LENGTH: 500
    }),

    /* ----------------------------------------------------------
     * Mensajes de UI (tono coloquial)
     * -------------------------------------------------------- */
    MESSAGES: Object.freeze({
        ERR_NETWORK:    'No pudimos conectar con el servidor. Revisa tu internet.',
        ERR_UNKNOWN:    'Algo salió mal. Intenta de nuevo.',
        ERR_SESSION:    'Tu sesión ya expiró. Vuelve a entrar.',
        ERR_REQUIRED:   'Este campo es obligatorio.',
        ERR_EMAIL:      'Ese correo no parece válido.',
        ERR_FILE_SIZE:  'El archivo es muy grande (máx. 10 MB).',
        ERR_FILE_EXT:   'Ese tipo de archivo no está permitido.',
        ERR_FILE_COUNT: 'Solo puedes subir hasta 5 archivos.',
        ERR_FILE_EMPTY: 'Adjunta al menos un archivo.',
        OK_LOGIN:       '¡Bienvenido!',
        OK_CHECKIN:     'Entrada registrada. ¡Buen trabajo!',
        OK_CHECKOUT:    'Salida registrada. ¡Descansa!',
        OK_EVIDENCIA:   'Evidencia enviada. ¡Gracias!'
    })
});