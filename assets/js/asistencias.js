/**
 * asistencias.js
 * ------------------------------------------------------------
 * Reglas de negocio del checador.
 *
 * Reglas duras:
 *  - La geo es OBLIGATORIA. Sin geo válida, no se registra.
 *  - Se intenta 3 veces con estrategias progresivas.
 *  - Se genera un requestId único por operación (idempotencia).
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
     * @throws {Error} si no se puede obtener ubicación o si el backend rechaza.
     */
    async registrarEntrada() {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

        // 1. Ubicación OBLIGATORIA
        const ubicacion = await this._obtenerUbicacionObligatoria();
        if (!ubicacion) {
            throw new Error('No pudimos obtener tu ubicación. Ve a un lugar abierto e intenta de nuevo.');
        }

        // 2. Generar requestId único
        const requestId = this._generarRequestId('in');

        // 3. Enviar al backend
        return Api.checkIn(token, ubicacion, requestId);
    },

    /**
     * Registra la salida del día.
     * @returns {Promise<Object>}
     * @throws {Error} si no se puede obtener ubicación o si el backend rechaza.
     */
    async registrarSalida() {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

        const ubicacion = await this._obtenerUbicacionObligatoria();
        if (!ubicacion) {
            throw new Error('No pudimos obtener tu ubicación. Ve a un lugar abierto e intenta de nuevo.');
        }

        const requestId = this._generarRequestId('out');

        return Api.checkOut(token, ubicacion, requestId);
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
     * Obtiene ubicación con 3 intentos progresivos.
     * Devuelve null si TODOS fallan.
     * @private
     * @returns {Promise<Object|null>}  { lat, lng, precision }
     */
    async _obtenerUbicacionObligatoria() {
        if (!navigator.geolocation) {
            console.warn('[Geo] Geolocalización no soportada por el navegador');
            return null;
        }

        const estrategias = [
            {
                nombre: 'alta precisión',
                opciones: { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            },
            {
                nombre: 'precisión media',
                opciones: { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
            },
            {
                nombre: 'última conocida',
                opciones: { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
            }
        ];

        for (let i = 0; i < estrategias.length; i++) {
            const est = estrategias[i];
            try {
                console.log('[Geo] Intento ' + (i + 1) + ': ' + est.nombre);
                const pos = await this._pedirPosicion(est.opciones);
                const geo = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    precision: pos.coords.accuracy
                };
                console.log('[Geo] ✅ ' + est.nombre + ':', geo.lat, geo.lng, '±' + geo.precision + 'm');
                return geo;
            } catch (err) {
                console.warn('[Geo] ❌ ' + est.nombre + ':', err.message);
            }
        }

        console.error('[Geo] Todas las estrategias fallaron');
        return null;
    },

    /**
     * Wrapper de getCurrentPosition como Promise.
     * @private
     */
    _pedirPosicion(opciones) {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, opciones);
        });
    },

    /**
     * Genera un ID único para la operación.
     * Formato: {tipo}-{timestamp}-{random}
     * @private
     * @param {string} tipo  'in' | 'out'
     * @returns {string}
     */
    _generarRequestId(tipo) {
        const ts = Date.now();
        const rand = Math.random().toString(36).slice(2, 10);
        return tipo + '-' + ts + '-' + rand;
    }
};