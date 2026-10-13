/** Formatos de foto aceitos pela API (SVG fica de fora de propósito: pode conter scripts). */
export const TIPOS_FOTO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

/** Tamanho máximo da foto, em bytes (o mesmo limite da API). */
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;
