/**
 * api.js
 * ------------------------------------------------------------
 * Única capa que habla con el backend.
 *
 *  - Si CONFIG.USE_MOCK === true, delega a ApiMock.
 *  - Si no, hace fetch real a Apps Script.
 *
 * Reglas:
 *  - No conoce a Auth. El token llega como parámetro explícito.
 *  - No toca el DOM.
 *  - Todos los métodos devuelven Promises.
 * ------------------------------------------------------------
 */

const Api = {

    /**
     * Envía una acción al backend.
     * @param {string} action
     * @param {object} payload
     * @returns {Promise<Object>}
     */
    async call(action, payload = {}) {

        // Modo desarrollo: delegar al mock
        if (typeof CONFIG !== 'undefined' && CONFIG.USE_MOCK && typeof ApiMock !== 'undefined') {
            return ApiMock.call(action, payload);
        }

        // Modo producción: fetch real
        const res = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, ...payload })
        });

        if (!res.ok) {
            throw new Error('Error HTTP: ' + res.status);
        }

        const json = await res.json();
        if (!json.success) {
            throw new Error(json.error || CONFIG.MESSAGES.ERR_UNKNOWN);
        }
        return json.data;
    },


    /* ==========================================================
     * ENDPOINTS (fachada)
     * ======================================================== */

    /**
     * Health check.
     * @returns {Promise<Object>}
     */
    ping() {
        return this.call('ping');
    },

    /**
     * Inicia sesión.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}  { token, tecnico }
     */
    login(email, password) {
        return this.call('login', { email, password });
    },

    /**
     * Cierra sesión.
     * @param {string} token
     * @returns {Promise<Object>}
     */
    logout(token) {
        return this.call('logout', { token });
    },

    /**
     * Registra entrada.
     * @param {string} token
     * @param {Object|null} ubicacion  { lat, lng, precision }
     * @returns {Promise<Object>}
     */
    checkIn(token, ubicacion) {
        return this.call('checkIn', { token, ubicacion });
    },

    /**
     * Registra salida.
     * @param {string} token
     * @param {Object|null} ubicacion
     * @returns {Promise<Object>}
     */
    checkOut(token, ubicacion) {
        return this.call('checkOut', { token, ubicacion });
    },

    /**
     * Obtiene la semana de asistencias.
     * @param {string} token
     * @param {string} [fecha]  YYYY-MM-DD (opcional; default: semana actual)
     * @returns {Promise<Object>}
     */
    getAsistenciasSemana(token, fecha = null) {
        const payload = { token };
        if (fecha) payload.fecha = fecha;
        return this.call('getAsistenciasSemana', payload);
    },

    /**
     * Sube una evidencia.
     * @param {string} token
     * @param {string} comentario
     * @param {Array<Object>} archivos  [{ nombre, tipo, tamano, base64 }]
     * @returns {Promise<Object>}
     */
    subirEvidencia(token, comentario, archivos) {
        return this.call('subirEvidencia', { token, comentario, archivos });
    },

    /**
     * Lista evidencias.
     * @param {string} token
     * @param {Object} [opciones]  { fecha_inicio, fecha_fin, id_tecnico }
     * @returns {Promise<Array>}
     */
    getEvidencias(token, opciones = {}) {
        return this.call('getEvidencias', { token, ...opciones });
    },

    /**
     * Obtiene el estado de todos los técnicos (solo admin).
     * @param {string} token
     * @returns {Promise<Object>}
     */
    getTecnicosEstado(token) {
        return this.call('getTecnicosEstado', { token });
    }
};