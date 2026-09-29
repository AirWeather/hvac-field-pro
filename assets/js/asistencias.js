/**
 * asistencias.js
 * ------------------------------------------------------------
 * Reglas de negocio del checador.
 *
 *  - Obtiene el token de Auth y lo pasa a Api.
 *  - No hace fetch directamente.
 *  - No toca el DOM.
 * ------------------------------------------------------------
 */

const Asistencias = {

    /**
     * Registra la entrada del día.
     * @returns {Promise<Object>}
     */
    async registrarEntrada() {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

        const ubicacion = await this._obtenerUbicacion();
        return Api.checkIn(token, ubicacion);
    },

    /**
     * Registra la salida del día.
     * @returns {Promise<Object>}
     */
    async registrarSalida() {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

        const ubicacion = await this._obtenerUbicacion();
        return Api.checkOut(token, ubicacion);
    },

    /**
     * Obtiene las asistencias de una semana.
     * @param {string} [fecha]  YYYY-MM-DD (opcional)
     * @returns {Promise<Object>}
     */
    async obtenerSemana(fecha = null) {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

        return Api.getAsistenciasSemana(token, fecha);
    },


    /* ==========================================================
     * HELPERS PRIVADOS
     * ======================================================== */

    /**
     * Obtiene la ubicación actual del dispositivo.
     * Si falla o el usuario niega, devuelve null.
     * @private
     * @returns {Promise<Object|null>}  { lat, lng, precision }
     */
    _obtenerUbicacion() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) return resolve(null);

            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    precision: pos.coords.accuracy
                }),
                () => resolve(null),
                { timeout: 5000, maximumAge: 60000 }
            );
        });
    }
};