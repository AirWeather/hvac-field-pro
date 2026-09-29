/**
 * router.js
 * Responsabilidad: navegación entre vistas basada en hash.
 */
const Router = {
    routes: {},

    register(hash, handler) {
        this.routes[hash] = handler;
    },

    navigate(hash) {
        window.location.hash = hash;
    },

    _resolve() {
        const hash = window.location.hash || CONFIG.ROUTES.LOGIN;
        const handler = this.routes[hash];
        if (handler) handler();
        else console.warn('Ruta no registrada:', hash);
    },

    start() {
        window.addEventListener('hashchange', () => this._resolve());
        this._resolve();
    }
};
