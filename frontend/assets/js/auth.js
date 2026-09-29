/**
 * auth.js
 * ------------------------------------------------------------
 * Responsabilidad: manejar la sesión del técnico.
 *
 *  - Login / logout.
 *  - Acceso al usuario actual.
 *  - Acceso al token y rol (para las otras capas).
 *
 * Reglas:
 *  - Usa Api y Storage, pero no toca el DOM.
 *  - No hace fetch directamente.
 * ------------------------------------------------------------
 */

const Auth = {

    /* ==========================================================
     * AUTENTICACIÓN
     * ======================================================== */

    /**
     * Inicia sesión con email y password.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}  { token, tecnico }
     */
    async login(email, password) {
        const data = await Api.login(email, password);
        Storage.set(CONFIG.STORAGE_KEYS.SESION, data);
        return data;
    },

    /**
     * Cierra la sesión activa.
     */
    logout() {
        Storage.remove(CONFIG.STORAGE_KEYS.SESION);
    },


    /* ==========================================================
     * ACCESO A LA SESIÓN
     * ======================================================== */

    /**
     * Devuelve la sesión actual (o null si no hay).
     * @returns {Object|null}  { token, tecnico }
     */
    currentUser() {
        return Storage.get(CONFIG.STORAGE_KEYS.SESION);
    },

    /**
     * ¿Hay una sesión activa?
     * @returns {boolean}
     */
    isLoggedIn() {
        return !!this.currentUser();
    },

    /**
     * Devuelve SOLO el token de la sesión.
     * @returns {string|null}
     */
    token() {
        const user = this.currentUser();
        return user && user.token ? user.token : null;
    },

    /**
     * Devuelve SOLO el rol del usuario.
     * @returns {string|null}  'tecnico' | 'admin' | null
     */
    rol() {
        const user = this.currentUser();
        return user && user.tecnico && user.tecnico.rol ? user.tecnico.rol : null;
    },

    /**
     * ¿El usuario actual es admin?
     * @returns {boolean}
     */
    isAdmin() {
        return this.rol() === 'admin';
    }
};