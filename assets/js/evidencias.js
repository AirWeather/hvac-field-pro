/**
 * evidencias.js
 * ------------------------------------------------------------
 * Reglas de negocio de evidencias.
 *
 *  - Obtiene el token de Auth y lo pasa a Api.
 *  - Valida archivos y comentario antes de enviar.
 *  - Genera requestId único para idempotencia.
 *  - No toca el DOM.
 * ------------------------------------------------------------
 */

const Evidencias = {

    /**
     * Sube una lista de archivos como evidencia.
     * @param {File[]} archivos
     * @param {string} [comentario]
     * @returns {Promise<Object>}
     */
    async subir(archivos, comentario = '') {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

        // 1. Validar lista de archivos
        const validacionArchivos = Files.validarLista(archivos);
        if (!validacionArchivos.valid) {
            throw new Error(validacionArchivos.error);
        }

        // 2. Validar comentario (opcional)
        const errorComentario = Validators.comentario(comentario);
        if (errorComentario) {
            throw new Error(errorComentario);
        }

        // 3. Generar requestId único (idempotencia)
        const requestId = this._generarRequestId();

        // 4. Convertir archivos a base64
        const archivosPayload = await Files.aPayload(validacionArchivos.archivosValidos);

        // 5. Enviar al backend
        return Api.subirEvidencia(token, comentario.trim(), archivosPayload, requestId);
    },

    /**
     * Lista evidencias del técnico actual.
     * @param {Object} [opciones]  { fecha_inicio, fecha_fin }
     * @returns {Promise<Array>}
     */
    async listar(opciones = {}) {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

        return Api.getEvidencias(token, opciones);
    },


    /* ==========================================================
     * HELPERS PRIVADOS
     * ======================================================== */

    /**
     * Genera un ID único para la operación.
     * Formato: ev-{timestamp}-{random}
     * @private
     * @returns {string}
     */
    _generarRequestId() {
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 10);
        return 'ev-' + ts + '-' + rand;
    }
};