/**
 * validators.js
 * ------------------------------------------------------------
 * Responsabilidad: validación de FORMATO de campos.
 *
 * Reglas:
 *  - Funciones puras (mismo input → mismo output, sin side effects).
 *  - No tocan el DOM.
 *  - No hacen fetch.
 *  - No leen localStorage.
 *  - Devuelven boolean (para uso directo) o string de error (para UI).
 *
 * IMPORTANTE: este archivo SOLO valida formato en el cliente.
 * La validación de NEGOCIO (duplicados, credenciales, política de
 * contraseñas) vive en el backend (Apps Script). El frontend nunca
 * decide si un dato es único o si una contraseña es correcta.
 * ------------------------------------------------------------
 */

const Validators = {

    /* ==========================================================
     * VALIDADORES BÁSICOS (devuelven boolean)
     * ======================================================== */

    /**
     * ¿El valor es un string no vacío (ignorando espacios)?
     * @param {*} value
     * @returns {boolean}
     */
    isRequired(value) {
        if (value === null || value === undefined) return false;
        if (typeof value !== 'string') return !!value;
        return value.trim().length > 0;
    },

    /**
     * ¿El valor es un string con contenido real?
     * Más estricto que isRequired: solo acepta strings.
     * @param {*} value
     * @returns {boolean}
     */
    isNonEmptyString(value) {
        return typeof value === 'string' && value.trim().length > 0;
    },

    /**
     * ¿El string no excede el máximo de caracteres?
     * Un valor vacío o undefined se considera válido.
     * @param {*} value
     * @param {number} max
     * @returns {boolean}
     */
    maxLength(value, max) {
        if (value === null || value === undefined) return true;
        return String(value).length <= max;
    },

    /**
     * ¿El string cumple con un mínimo de caracteres?
     * @param {*} value
     * @param {number} min
     * @returns {boolean}
     */
    minLength(value, min) {
        if (typeof value !== 'string') return false;
        return value.length >= min;
    },

    /**
     * ¿El valor es un email con formato válido?
     * Validación pragmática (no RFC 5322 completa).
     * @param {*} value
     * @returns {boolean}
     */
    isEmail(value) {
        if (typeof value !== 'string') return false;
        const email = value.trim();
        if (email.length === 0) return false;
        if (email.length > 254) return false; // RFC 5321

        // Regex pragmática: algo@algo.algo (con TLD >= 2)
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        return re.test(email);
    },

    /**
     * ¿El valor es un número entero (o string numérico entero)?
     * @param {*} value
     * @returns {boolean}
     */
    isInteger(value) {
        if (value === null || value === undefined || value === '') return false;
        return Number.isInteger(Number(value));
    },

    /**
     * ¿El valor está dentro de un rango numérico?
     * @param {*} value
     * @param {number} min
     * @param {number} max
     * @returns {boolean}
     */
    inRange(value, min, max) {
        const n = Number(value);
        if (Number.isNaN(n)) return false;
        return n >= min && n <= max;
    },

    /**
     * ¿El valor está dentro de una lista blanca?
     * @param {*} value
     * @param {Array} allowedValues
     * @returns {boolean}
     */
    oneOf(value, allowedValues) {
        if (!Array.isArray(allowedValues)) return false;
        return allowedValues.includes(value);
    },


    /* ==========================================================
     * VALIDADORES DE FORMULARIO (devuelven string o null)
     * ----------------------------------------------------------
     * Pensados para usar directamente en app.js:
     *   const error = Validators.email(value);
     *   if (error) { mostrar error } else { continuar }
     * ======================================================== */

    /**
     * Valida un email de login/registro.
     * @param {string} value
     * @param {object} [opts]
     * @param {number} [opts.maxLength]
     * @returns {string|null} mensaje de error o null si es válido
     */
    email(value, opts = {}) {
        const max = opts.maxLength ?? CONFIG.VALIDATION.EMAIL_MAX_LENGTH;

        if (!this.isRequired(value)) {
            return CONFIG.MESSAGES.ERR_REQUIRED;
        }
        if (!this.maxLength(value, max)) {
            return `El correo no puede tener más de ${max} caracteres.`;
        }
        if (!this.isEmail(value)) {
            return CONFIG.MESSAGES.ERR_EMAIL;
        }
        return null;
    },

    /**
     * Valida que un campo cualquiera no esté vacío.
     * @param {string} value
     * @param {string} [label] nombre legible del campo (para el mensaje)
     * @returns {string|null}
     */
    required(value, label = 'Este campo') {
        if (!this.isRequired(value)) {
            return label === 'Este campo'
                ? CONFIG.MESSAGES.ERR_REQUIRED
                : `${label} es obligatorio.`;
        }
        return null;
    },

    /**
     * Valida un comentario (opcional, con límite de longitud).
     * @param {string} value
     * @param {object} [opts]
     * @param {number} [opts.maxLength]
     * @param {boolean} [opts.required=false]
     * @returns {string|null}
     */
    comentario(value, opts = {}) {
        const max = opts.maxLength ?? CONFIG.VALIDATION.COMENTARIO_MAX_LENGTH;
        const required = opts.required === true;

        if (required && !this.isRequired(value)) {
            return CONFIG.MESSAGES.ERR_REQUIRED;
        }
        if (!this.maxLength(value, max)) {
            return `El comentario no puede tener más de ${max} caracteres.`;
        }
        return null;
    },


    /* ==========================================================
     * VALIDACIÓN DE OBJETOS COMPLETOS
     * ----------------------------------------------------------
     * Devuelven { valid: boolean, errors: { campo: mensaje } }
     * ======================================================== */

    /**
     * Valida el objeto de login.
     * @param {{email:string, password:string}} data
     * @returns {{valid:boolean, errors:Object}}
     */
    loginPayload(data) {
        const errors = {};

        const emailErr = this.email(data.email);
        if (emailErr) errors.email = emailErr;

        // El password solo se valida como "no vacío" en el frontend.
        // Su política (longitud, complejidad) vive en el backend.
        if (!this.isRequired(data.password)) {
            errors.password = 'La contraseña es obligatoria.';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Valida el objeto de evidencia (sin archivos: eso lo valida files.js).
     * @param {{comentario?:string}} data
     * @returns {{valid:boolean, errors:Object}}
     */
    evidenciaPayload(data) {
        const errors = {};

        const comentarioErr = this.comentario(data.comentario, { required: false });
        if (comentarioErr) errors.comentario = comentarioErr;

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }
};