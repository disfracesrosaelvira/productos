export const MODO_PUBLICO = import.meta.env.VITE_MODO_PUBLICO === 'true'

const base = import.meta.env.BASE_URL || '/'

// URL de la app interna (con login). Desde /productos/publico/ apunta a /productos/.
export const URL_STAFF = base.replace(/publico\/?$/, '')
