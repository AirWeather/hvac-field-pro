/**
 * app.js
 * ------------------------------------------------------------
 * Bootstrap y wiring de la app.
 *
 *  - Registra rutas en el Router.
 *  - Conecta eventos del DOM con handlers.
 *  - Protege rutas según rol (admin vs técnico).
 *  - Usa overlay de carga en operaciones largas.
 *  - Bloquea doble-clic con flags.
 * ------------------------------------------------------------
 */

(function bootstrap() {

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        aplicarAcceptDeArchivos();
        registerRoutes();
        bindEvents();
        Router.start();
    }


    /* ==========================================================
     * CONFIGURACIÓN INICIAL
     * ======================================================== */

    function aplicarAcceptDeArchivos() {
        const input = document.getElementById('input-archivos');
        if (input && CONFIG.FILES.ACCEPT_ATTR) {
            input.setAttribute('accept', CONFIG.FILES.ACCEPT_ATTR);
        }
    }


    /* ==========================================================
     * RUTAS
     * ======================================================== */

    function registerRoutes() {

        /* ---------- Login ---------- */
        Router.register(CONFIG.ROUTES.LOGIN, () => {
            UI.toggle('btn-logout', false);
            UI.show('view-login');
        });

        /* ---------- Dashboard ---------- */
        Router.register(CONFIG.ROUTES.DASHBOARD, () => {
            if (!Auth.isLoggedIn()) {
                return Router.navigate(CONFIG.ROUTES.LOGIN);
            }

            const user = Auth.currentUser();
            UI.setText('nombre-tecnico', user?.tecnico?.nombre || '—');

            // 🛡️ Solo admin ve el menú Supervisión
            UI.toggle('menu-supervisor', Auth.isAdmin());

            UI.toggle('btn-logout', true);
            UI.show('view-dashboard');
        });

        /* ---------- Checador (técnico y admin) ---------- */
        Router.register(CONFIG.ROUTES.CHECADOR, () => {
            if (!Auth.isLoggedIn()) {
                return Router.navigate(CONFIG.ROUTES.LOGIN);
            }
            UI.toggle('btn-logout', true);
            UI.hideMsg('checador-msg');
            UI.show('view-checador');
        });

        /* ---------- Evidencias (técnico y admin) ---------- */
        Router.register(CONFIG.ROUTES.EVIDENCIAS, () => {
            if (!Auth.isLoggedIn()) {
                return Router.navigate(CONFIG.ROUTES.LOGIN);
            }
            UI.toggle('btn-logout', true);
            UI.hideMsg('evidencia-msg');
            UI.clearFileList();
            UI.show('view-evidencias');
        });

        /* ---------- Supervisor (solo admin) ---------- */
        Router.register(CONFIG.ROUTES.SUPERVISOR, () => {
            if (!Auth.isLoggedIn()) {
                return Router.navigate(CONFIG.ROUTES.LOGIN);
            }

            // 🛡️ Bloquear acceso a no-admin
            if (!Auth.isAdmin()) {
                console.warn('[Router] Acceso denegado: solo admin');
                UI.showError('supervisor-msg', 'Solo administradores pueden ver la supervisión.');
                return Router.navigate(CONFIG.ROUTES.DASHBOARD);
            }

            UI.toggle('btn-logout', true);
            UI.hideMsg('supervisor-msg');
            UI.show('view-supervisor');
            cargarSupervisor();
        });
    }


    /* ==========================================================
     * EVENTOS
     * ======================================================== */

    function bindEvents() {
        const formLogin = document.getElementById('form-login');
        if (formLogin) formLogin.addEventListener('submit', onLoginSubmit);

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) btnLogout.addEventListener('click', onLogout);

        const btnIn  = document.getElementById('btn-checkin');
        const btnOut = document.getElementById('btn-checkout');
        if (btnIn)  btnIn.addEventListener('click',  onCheckIn);
        if (btnOut) btnOut.addEventListener('click', onCheckOut);

        const inputArchivos = document.getElementById('input-archivos');
        if (inputArchivos) inputArchivos.addEventListener('change', onArchivosChange);

        const formEv = document.getElementById('form-evidencia');
        if (formEv) formEv.addEventListener('submit', onEvidenciaSubmit);

        const btnRefreshSup = document.getElementById('btn-refresh-sup');
        if (btnRefreshSup) btnRefreshSup.addEventListener('click', cargarSupervisor);
    }


    /* ==========================================================
     * HANDLERS: LOGIN / LOGOUT
     * ======================================================== */

    async function onLoginSubmit(e) {
        e.preventDefault();

        const fd = new FormData(e.target);
        const email    = String(fd.get('email') || '').trim();
        const password = String(fd.get('password') || '');

        const check = Validators.loginPayload({ email, password });
        if (!check.valid) {
            const primerError = Object.values(check.errors)[0];
            UI.showError('login-error', primerError);
            return;
        }

        UI.hideMsg('login-error');
        UI.setButtonLoading('btn-login');

        try {
            await Auth.login(email, password);
            e.target.reset();
            Router.navigate(CONFIG.ROUTES.DASHBOARD);
        } catch (err) {
            UI.showError('login-error', err.message || CONFIG.MESSAGES.ERR_UNKNOWN);
        } finally {
            UI.restoreButton('btn-login');
        }
    }

    function onLogout() {
        Auth.logout();
        Router.navigate(CONFIG.ROUTES.LOGIN);
    }


    /* ==========================================================
     * HANDLERS: CHECADOR (con overlay + bloqueo)
     * ======================================================== */

    let _enviandoCheckIn = false;
    let _enviandoCheckOut = false;

    async function onCheckIn() {
        if (_enviandoCheckIn) {
            console.warn('[Anti-duplicado] Check-in en curso');
            return;
        }
        _enviandoCheckIn = true;

        UI.hideMsg('checador-msg');
        UI.showLoading('📍 Registrando entrada', 'Obteniendo tu ubicación...');

        try {
            await Asistencias.registrarEntrada();
            UI.updateLoading('✅ Guardando...', '');
            await new Promise(r => setTimeout(r, 400));
            UI.hideLoading();
            UI.showSuccess('checador-msg', CONFIG.MESSAGES.OK_CHECKIN);
        } catch (err) {
            UI.hideLoading();
            UI.showError('checador-msg', err.message || CONFIG.MESSAGES.ERR_UNKNOWN);
        } finally {
            setTimeout(() => { _enviandoCheckIn = false; }, 2000);
        }
    }

    async function onCheckOut() {
        if (_enviandoCheckOut) {
            console.warn('[Anti-duplicado] Check-out en curso');
            return;
        }
        _enviandoCheckOut = true;

        UI.hideMsg('checador-msg');
        UI.showLoading('📍 Registrando salida', 'Obteniendo tu ubicación...');

        try {
            await Asistencias.registrarSalida();
            UI.updateLoading('✅ Guardando...', '');
            await new Promise(r => setTimeout(r, 400));
            UI.hideLoading();
            UI.showSuccess('checador-msg', CONFIG.MESSAGES.OK_CHECKOUT);
        } catch (err) {
            UI.hideLoading();
            UI.showError('checador-msg', err.message || CONFIG.MESSAGES.ERR_UNKNOWN);
        } finally {
            setTimeout(() => { _enviandoCheckOut = false; }, 2000);
        }
    }


    /* ==========================================================
     * HANDLERS: EVIDENCIAS (con overlay + bloqueo)
     * ======================================================== */

    function onArchivosChange(e) {
        const archivos = Array.from(e.target.files || []);

        const check = Files.validarLista(archivos);
        if (!check.valid) {
            UI.showError('evidencia-msg', check.error);
            UI.clearFileList();
            e.target.value = '';
            return;
        }

        UI.hideMsg('evidencia-msg');
        UI.renderFileList(check.archivosValidos);
    }

    let _enviandoEvidencia = false;

    async function onEvidenciaSubmit(e) {
        e.preventDefault();

        if (_enviandoEvidencia) {
            console.warn('[Anti-duplicado] Envío de evidencia en curso');
            return;
        }
        _enviandoEvidencia = true;

        const form = e.target;
        const fd = new FormData(form);
        const archivos   = Array.from(fd.getAll('archivos') || []);
        const comentario = String(fd.get('comentario') || '').trim();

        const checkArchivos = Files.validarLista(archivos);
        if (!checkArchivos.valid) {
            UI.showError('evidencia-msg', checkArchivos.error);
            _enviandoEvidencia = false;
            return;
        }

        const checkForm = Validators.evidenciaPayload({ comentario });
        if (!checkForm.valid) {
            const primerError = Object.values(checkForm.errors)[0];
            UI.showError('evidencia-msg', primerError);
            _enviandoEvidencia = false;
            return;
        }

        UI.hideMsg('evidencia-msg');
        UI.showLoading('📤 Subiendo evidencia', 'Preparando archivos...');

        try {
            await Evidencias.subir(archivos, comentario);
            UI.updateLoading('✅ Guardando...', '');
            await new Promise(r => setTimeout(r, 400));
            UI.hideLoading();
            UI.showSuccess('evidencia-msg', CONFIG.MESSAGES.OK_EVIDENCIA);
            form.reset();
            UI.clearFileList();
        } catch (err) {
            UI.hideLoading();
            UI.showError('evidencia-msg', err.message || CONFIG.MESSAGES.ERR_UNKNOWN);
        } finally {
            setTimeout(() => { _enviandoEvidencia = false; }, 2000);
        }
    }


    /* ==========================================================
     * SUPERVISOR
     * ======================================================== */

    let _mapa = null;

    async function cargarSupervisor() {
        UI.hideMsg('supervisor-msg');

        try {
            const data = await Supervisor.cargarEstado();
            UI.renderTecnicosEstado(data);
            _renderMapaSupervisor(data.tecnicos);
        } catch (err) {
            UI.showError('supervisor-msg', err.message || CONFIG.MESSAGES.ERR_UNKNOWN);
        }
    }

    function _renderMapaSupervisor(tecnicos) {
        const cont = document.getElementById('map-supervisor');
        if (!cont) return;

        // 1. Inicializar mapa la primera vez
        if (!_mapa) {
            _mapa = L.map('map-supervisor').setView([19.432608, -99.133209], 11);

            // 🛡️ API key desde CONFIG (no hardcodeada)
            const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' +
                            (CONFIG.MAP_API_KEY ? '?key=' + CONFIG.MAP_API_KEY : '');

            L.tileLayer(tileUrl, {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors © CARTO'
            }).addTo(_mapa);
        }

        // 2. Limpiar marcadores previos
        _mapa.eachLayer(function(layer) {
            if (layer instanceof L.Marker) _mapa.removeLayer(layer);
        });

        // 3. Agregar marcadores
        const bounds = [];
        tecnicos.forEach(function(t) {
            if (!t.ubicacion || t.ubicacion.lat == null) return;

            const icono = L.divIcon({
                className: '',
                html: '<div class="marker-pin estado-' + t.estado + '">●</div>',
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            });

            const marker = L.marker([t.ubicacion.lat, t.ubicacion.lng], { icon: icono });
            marker.bindPopup(
                '<strong>' + t.nombre + '</strong><br>' +
                'Estado: ' + t.estado + '<br>' +
                'Entrada: ' + (t.entrada_hoy || '—') +
                (t.salida_hoy ? '<br>Salida: ' + t.salida_hoy : '')
            );
            marker.addTo(_mapa);
            bounds.push([t.ubicacion.lat, t.ubicacion.lng]);
        });

        // 4. Ajustar zoom si hay marcadores
        if (bounds.length > 0) {
            _mapa.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }

})();