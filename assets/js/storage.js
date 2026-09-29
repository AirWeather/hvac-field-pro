/**
 * storage.js
 * ------------------------------------------------------------
 * Responsabilidad: abstraer el acceso a localStorage.
 *
 * Reglas:
 *  - Ningún otro archivo debe llamar a localStorage directamente.
 *  - Serializa/deserializa JSON automáticamente.
 *  - Tolera errores (localStorage puede fallar en modo privado,
 *    cuota llena, o navegadores restringidos).
 *  - No conoce el dominio de la app (no sabe qué es "sesión",
 *    solo guarda y devuelve claves/valores).
 * ------------------------------------------------------------
 */

const Storage = {

    /**
     * Guarda un valor serializándolo como JSON.
     * @param {string} key
     * @param {*} value
     * @returns {boolean} true si se guardó, false si falló
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.warn('[Storage] No se pudo guardar la clave:', key, err);
            return false;
        }
    },

    /**
     * Lee un valor y lo deserializa.
     * @param {string} key
     * @returns {*} valor o null si no existe / no se puede parsear
     */
    get(key) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return null;
            return JSON.parse(raw);
        } catch (err) {
            console.warn('[Storage] No se pudo leer la clave:', key, err);
            return null;
        }
    },

    /**
     * Elimina una clave.
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (err) {
            console.warn('[Storage] No se pudo eliminar la clave:', key, err);
            return false;
        }
    },

    /**
     * Verifica si existe una clave.
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (err) {
            return false;
        }
    },

    /**
     * Limpia TODO el localStorage.
     * Usar con cuidado: afecta a otras apps del mismo dominio.
     * @returns {boolean}
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (err) {
            console.warn('[Storage] No se pudo limpiar localStorage', err);
            return false;
        }
    }
};