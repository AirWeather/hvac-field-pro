/**
 * ui.js
 * ------------------------------------------------------------
 * Helpers de manipulación del DOM.
 * ------------------------------------------------------------
 */

const UI = {

    /* ==========================================================
     * VISTAS
     * ======================================================== */

    show(viewId) {
        document.querySelectorAll('.view').forEach(v => v.hidden = true);
        const el = document.getElementById(viewId);
        if (el) el.hidden = false;
    },


    /* ==========================================================
     * TEXTO Y MENSAJES
     * ======================================================== */

    setText(id, texto) {
        const el = document.getElementById(id);
        if (el) el.textContent = texto;
    },

    toggle(id, visible) {
        const el = document.getElementById(id);
        if (el) el.hidden = !visible;
    },

    showError(id, mensaje) {
        this._setMsg(id, mensaje, 'msg-error');
    },

    showSuccess(id, mensaje) {
        this._setMsg(id, mensaje, 'msg-success');
    },

    showInfo(id, mensaje) {
        this._setMsg(id, mensaje, 'msg-info');
    },

    hideMsg(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.hidden = true;
        el.textContent = '';
    },


    /* ==========================================================
     * FORMULARIOS
     * ======================================================== */

    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form && typeof form.reset === 'function') form.reset();
    },

    focusField(formId, name) {
        const form = document.getElementById(formId);
        if (!form) return;
        const field = form.querySelector(`[name="${name}"]`);
        if (field && typeof field.focus === 'function') field.focus();
    },


    /* ==========================================================
     * BOTONES
     * ======================================================== */

    setButtonEnabled(id, enabled) {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !enabled;
    },

    setButtonLoading(id, texto = 'Procesando…') {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (!btn.dataset.originalHtml) {
            btn.dataset.originalHtml = btn.innerHTML;
        }
        btn.disabled = true;
        btn.innerHTML = texto;
    },

    restoreButton(id) {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (btn.dataset.originalHtml) {
            btn.innerHTML = btn.dataset.originalHtml;
            delete btn.dataset.originalHtml;
        }
        btn.disabled = false;
    },


    /* ==========================================================
     * LISTA DE ARCHIVOS
     * ======================================================== */

    renderFileList(archivos) {
        const lista = document.getElementById('file-list');
        if (!lista) return;

        const arr = Array.isArray(archivos) ? archivos : [];

        if (arr.length === 0) {
            lista.hidden = true;
            lista.innerHTML = '';
            return;
        }

        lista.hidden = false;
        lista.innerHTML = arr.map((archivo, i) => {
            const nombre = this._escapeHtml(archivo.name);
            const tamano = Files.formatoTamano(archivo.size);
            const tipo   = Files.tipoIcono(archivo);
            const color  = Files.colorIcono(archivo);
            const icono  = this._svgPorTipo(tipo);

            return `
                <li class="file-item" data-index="${i}">
                    <div class="file-item-icon file-item-icon-${color}">
                        ${icono}
                    </div>
                    <div class="file-item-body">
                        <div class="file-item-name" title="${nombre}">${nombre}</div>
                        <div class="file-item-size">${tamano}</div>
                    </div>
                </li>
            `;
        }).join('');
    },

    clearFileList() {
        const lista = document.getElementById('file-list');
        if (!lista) return;
        lista.innerHTML = '';
        lista.hidden = true;
    },


    /* ==========================================================
     * SUPERVISIÓN
     * ======================================================== */

    /**
     * Renderiza el dashboard de supervisor.
     * @param {Object} data  { actualizado, total, tecnicos }
     */
    renderTecnicosEstado(data) {
        if (!data || !Array.isArray(data.tecnicos)) return;

        const tecnicos = data.tecnicos;

        // 1. Resumen
        const conteo = { trabajando: 0, termino: 0, sin_checar: 0 };
        tecnicos.forEach(function(t) {
            if (conteo[t.estado] !== undefined) conteo[t.estado]++;
        });

        this.setText('sup-total',       String(data.total || tecnicos.length));
        this.setText('sup-trabajando',  String(conteo.trabajando));
        this.setText('sup-termino',     String(conteo.termino));
        this.setText('sup-sin_checar',  String(conteo.sin_checar));
        this.setText('sup-actualizado', this._formatoHora_(data.actualizado));

        // 2. Lista de técnicos
        const lista = document.getElementById('lista-tecnicos');
        if (!lista) return;

        if (tecnicos.length === 0) {
            lista.innerHTML = '<li class="tecnico-item">No hay técnicos activos.</li>';
            return;
        }

        lista.innerHTML = tecnicos.map(function(t) {
            const claseEstado = 'estado-' + t.estado;
            const badge = '<span class="tecnico-item-badge badge-' + t.estado + '">' + t.estado + '</span>';

            let info = '';
            if (t.estado === 'trabajando') {
                info = 'Entrada: ' + (t.entrada_hoy || '—');
            } else if (t.estado === 'termino') {
                info = 'Entrada: ' + t.entrada_hoy + ' · Salida: ' + t.salida_hoy;
            } else {
                info = 'Sin checar hoy';
            }

            return `
                <li class="tecnico-item">
                    <div class="tecnico-item-icon ${claseEstado}">
                        ${t.estado === 'trabajando' ? '●' : (t.estado === 'termino' ? '✓' : '○')}
                    </div>
                    <div class="tecnico-item-body">
                        <div class="tecnico-item-nombre">${this._escapeHtml(t.nombre)}</div>
                        <div class="tecnico-item-info">${this._escapeHtml(info)}</div>
                    </div>
                    ${badge}
                </li>
            `;
        }, this).join('');
    },


    /* ==========================================================
     * HELPERS PRIVADOS
     * ======================================================== */

    _setMsg(id, mensaje, clase) {
        const el = document.getElementById(id);
        if (!el) return;

        el.classList.remove('msg-error', 'msg-success', 'msg-info');

        if (!mensaje) {
            el.hidden = true;
            el.textContent = '';
            return;
        }

        el.textContent = mensaje;
        el.classList.add(clase);
        el.hidden = false;
    },

    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    },

    _svgPorTipo(tipo) {
        const svgs = {
            image: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
            pdf:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            doc:   '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
            sheet: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>',
            file:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>'
        };
        return svgs[tipo] || svgs.file;
    },

    _formatoHora_(iso) {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            return h + ':' + m;
        } catch (e) {
            return '—';
        }
    }
};