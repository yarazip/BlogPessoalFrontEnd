/** Novidade ou aviso oficial da Rasura, como a API devolve (GET /api/avisos). */
export interface Aviso {
  id: number;
  titulo: string;
  texto: string;
  data: string;
}

/** Dados enviados por um administrador para publicar um aviso. */
export interface AvisoRequest {
  titulo: string;
  texto: string;
}

/** Limites validados pela API (mantenha em sincronia com AvisoRequestDTO). */
export const LIMITES_AVISO = {
  tituloMax: 100,
  textoMax: 1000
} as const;
