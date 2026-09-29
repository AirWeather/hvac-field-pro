/**
 * files.js
 * ------------------------------------------------------------
 * Responsabilidad: utilidades de archivos para evidencias.
 *
 *  - Validar extensión permitida.
 *  - Validar tamaño por archivo.
 *  - Validar cantidad total.
 *  - Convertir archivo a base64 (para enviar al backend).
 *  - Formatear tamaño legible ("2.3 MB").
 *  - Extraer extensión de un nombre de archivo.
 *  - Obtener ícono según tipo (para la lista de archivos en UI).
 *
 * Reglas:
 *  - Sin dependencias (solo usa CONFIG y Validators).
 *  - Sin acceso al DOM.
 *  - Sin fetch.
 *  - Funciones puras excepto _archivoABase64 (usa FileReader).
 * ------------------------------------------------------------
 */

const Files = {

    /* ==========================================================
     * VALIDACIÓN
     * ======================================================== */

    /**
     * Extrae la extensión de un nombre de archivo (minúsculas, sin punto).
     * @param {string} nombreArchivo
     * @returns {string} extensión o '' si no tiene
     */
    extension(nombreArchivo) {
        if (typeof nombreArchivo !== 'string') return '';
        const partes = nombreArchivo.split('.');
        if (partes.length < 2) return '';
        return partes.pop().toLowerCase();
    },

    /**
     * ¿La extensión del archivo está permitida?
     * @param {File|string} archivo File o nombre de archivo
     * @returns {boolean}
     */
    tieneExtensionPermitida(archivo) {
        const nombre = typeof archivo === 'string' ? archivo : (archivo?.name || '');
        const ext = this.extension(nombre);
        if (!ext) return false;
        return CONFIG.FILES.ALLOWED_EXTENSIONS.includes(ext);
    },

    /**
     * ¿El archivo no excede el tamaño máximo?
     * @param {File} archivo
     * @returns {boolean}
     */
    tieneTamanoValido(archivo) {
        if (!archivo || typeof archivo.size !== 'number') return false;
        return archivo.size <= CONFIG.FILES.MAX_SIZE_BYTES;
    },

    /**
     * ¿La cantidad de archivos no excede el máximo?
     * @param {File[]|number} archivos Array de archivos o cantidad
     * @returns {boolean}
     */
    tieneCantidadValida(archivos) {
        const n = Array.isArray(archivos) ? archivos.length : Number(archivos);
        if (Number.isNaN(n)) return false;
        return n > 0 && n <= CONFIG.FILES.MAX_FILES;
    },

    /**
     * Valida una lista completa de archivos.
     * @param {File[]} archivos
     * @returns {{valid:boolean, error:string|null, archivosValidos:File[]}}
     */
    validarLista(archivos) {
        const lista = Array.isArray(archivos) ? archivos.filter(Boolean) : [];

        if (lista.length === 0) {
            return {
                valid: false,
                error: CONFIG.MESSAGES.ERR_FILE_EMPTY,
                archivosValidos: []
            };
        }

        if (!this.tieneCantidadValida(lista)) {
            return {
                valid: false,
                error: CONFIG.MESSAGES.ERR_FILE_COUNT,
                archivosValidos: []
            };
        }

        for (const archivo of lista) {
            if (!this.tieneExtensionPermitida(archivo)) {
                return {
                    valid: false,
                    error: `"${archivo.name}" no tiene una extensión permitida.`,
                    archivosValidos: []
                };
            }
            if (!this.tieneTamanoValido(archivo)) {
                return {
                    valid: false,
                    error: `"${archivo.name}" es muy grande (máx. 10 MB).`,
                    archivosValidos: []
                };
            }
        }

        return {
            valid: true,
            error: null,
            archivosValidos: lista
        };
    },


    /* ==========================================================
     * CONVERSIÓN
     * ======================================================== */

    /**
     * Convierte un File a string base64 (sin prefijo data:).
     * @param {File} archivo
     * @returns {Promise<string>}
     */
    aBase64(archivo) {
        return new Promise((resolve, reject) => {
            if (!archivo || !(archivo instanceof File)) {
                reject(new Error('No es un archivo válido'));
                return;
            }
            const reader = new FileReader();
            reader.onload  = () => {
                const result = String(reader.result || '');
                // result viene como "data:image/png;base64,iVBOR..."
                const idx = result.indexOf(',');
                resolve(idx >= 0 ? result.slice(idx + 1) : result);
            };
            reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
            reader.readAsDataURL(archivo);
        });
    },

    /**
     * Convierte una lista de archivos a un array de objetos listos para enviar.
     * Resuelve todas las conversiones en paralelo.
     * @param {File[]} archivos
     * @returns {Promise<Array<{nombre:string, tipo:string, tamano:number, base64:string}>>}
     */
    async aPayload(archivos) {
        const lista = Array.isArray(archivos) ? archivos : [];
        return Promise.all(lista.map(async (archivo) => ({
            nombre: archivo.name,
            tipo:   archivo.type || this._tipoPorExtension(archivo.name),
            tamano: archivo.size,
            base64: await this.aBase64(archivo)
        })));
    },


    /* ==========================================================
     * FORMATEO PARA UI
     * ======================================================== */

    /**
     * Formatea bytes a string legible ("1.2 MB", "340 KB").
     * @param {number} bytes
     * @returns {string}
     */
    formatoTamano(bytes) {
        const n = Number(bytes);
        if (!Number.isFinite(n) || n < 0) return '—';
        if (n < 1024) return `${n} B`;
        if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
        return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    },

    /**
     * Devuelve un tipo de ícono para usar en la lista de archivos.
     * @param {File|string} archivo File o nombre
     * @returns {'image'|'pdf'|'doc'|'sheet'|'file'}
     */
    tipoIcono(archivo) {
        const nombre = typeof archivo === 'string' ? archivo : (archivo?.name || '');
        const ext = this.extension(nombre);
        if (['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (ext === 'docx' || ext === 'doc') return 'doc';
        if (ext === 'xlsx' || ext === 'xls') return 'sheet';
        return 'file';
    },

    /**
     * Devuelve un color/estado para el ícono según el tipo.
     * @param {File|string} archivo
     * @returns {string} nombre de color: 'primary', 'danger', 'accent', 'muted'
     */
    colorIcono(archivo) {
        const tipo = this.tipoIcono(archivo);
        switch (tipo) {
            case 'image': return 'primary';
            case 'pdf':   return 'danger';
            case 'doc':   return 'accent';
            case 'sheet': return 'success';
            default:      return 'muted';
        }
    },


    /* ==========================================================
     * HELPERS PRIVADOS
     * ======================================================== */

    /**
     * Devuelve un MIME type aproximado a partir de la extensión.
     * Útil cuando el navegador no llena file.type (raro pero pasa).
     * @param {string} nombreArchivo
     * @returns {string}
     */
    _tipoPorExtension(nombreArchivo) {
        const ext = this.extension(nombreArchivo);
        const mapa = {
            jpg:  'image/jpeg',
            jpeg: 'image/jpeg',
            png:  'image/png',
            webp: 'image/webp',
            heic: 'image/heic',
            pdf:  'application/pdf',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        return mapa[ext] || 'application/octet-stream';
    }
};