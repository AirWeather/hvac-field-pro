/**
 * supervisor.js
 * ------------------------------------------------------------
 * Lógica del dashboard de supervisor.
 *
 * Reglas:
 *  - Solo admin puede acceder.
 *  - Verifica el rol ANTES de llamar al backend (defensa en profundidad).
 *  - Obtiene el token de Auth y lo pasa a Api.
 *  - Controla el auto-refresh.
 *  - No toca el DOM (delega a UI).
 * ------------------------------------------------------------
 */

const Supervisor = {

    _intervalId: null,


    /* ==========================================================
     * CARGA DE DATOS
     * ======================================================== */

    /**
     * Carga el estado de todos los técnicos.
     * @returns {Promise<Object>}
     * @throws {Error} si no hay sesión o si no es admin.
     */
    async cargarEstado() {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

        // 🛡️ Defensa en profundidad: verificar rol ANTES de llamar al backend.
        if (!Auth.isAdmin()) {
            throw new Error('Solo administradores pueden ver la supervisión.');
        }

        return Api.getTecnicosEstado(token);
    },


    /* ==========================================================
     * AUTO-REFRESH
     * ======================================================== */

    /**
     * Inicia el auto-refresh cada 60 segundos.
     * @param {Function} callback
     */
    iniciarAutoRefresh(callback) {
        this.detenerAutoRefresh();
        this._intervalId = setInterval(callback, 60 * 1000);
    },

    /**
     * Detiene el auto-refresh.
     */
    detenerAutoRefresh() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }
};