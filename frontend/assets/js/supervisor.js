/**
 * supervisor.js
 * ------------------------------------------------------------
 * Lógica del dashboard de supervisor.
 *
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
     */
    async cargarEstado() {
        const token = Auth.token();
        if (!token) throw new Error(CONFIG.MESSAGES.ERR_SESSION);

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