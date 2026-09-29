/**
 * api.mock.js
 * ------------------------------------------------------------
 * Datos falsos para desarrollo.
 * Solo se activa si CONFIG.USE_MOCK === true.
 * ⚠️ No se usa en producción.
 * ------------------------------------------------------------
 */

const ApiMock = {

    async call(action, payload = {}) {
        console.log('[API MOCK]', action, payload);
        await this._delay(400);

        const handlers = {
            ping:           () => ({ pong: true }),
            login:          () => this._login(payload),
            checkIn:        () => this._checkIn(payload),
            checkOut:       () => this._checkOut(payload),
            subirEvidencia: () => this._subirEvidencia(payload)
        };

        if (!handlers[action]) {
            throw new Error('[MOCK] Acción no implementada: ' + action);
        }

        return handlers[action]();
    },

    _login(payload) {
        if (payload.password === 'error') {
            throw new Error('Credenciales incorrectas. Verifica e intenta de nuevo.');
        }
        return {
            token: 'mock-token-' + Date.now(),
            tecnico: {
                id: 1,
                nombre: 'Juan Pérez',
                email: payload.email
            }
        };
    },

    _checkIn(payload) {
        return {
            id_registro: 'REG-' + Date.now(),
            hora: this._horaActual(),
            tipo: 'entrada',
            id_tecnico: payload.id_tecnico
        };
    },

    _checkOut(payload) {
        return {
            id_registro: 'REG-' + Date.now(),
            hora: this._horaActual(),
            tipo: 'salida',
            id_tecnico: payload.id_tecnico
        };
    },

    _subirEvidencia(payload) {
        const n = payload.archivos?.length || 0;
        const totalBytes = (payload.archivos || []).reduce((s, a) => s + (a.tamano || 0), 0);
        return {
            id_evidencia: 'EV-' + Date.now(),
            url: 'https://ejemplo.com/mock/' + Date.now(),
            archivos_recibidos: n,
            bytes_recibidos: totalBytes,
            comentario: payload.comentario || ''
        };
    },

    _delay(ms) { return new Promise(r => setTimeout(r, ms)); },

    _horaActual() {
        return new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    }
};