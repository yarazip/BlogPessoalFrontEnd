/** Perfil público de uma pessoa (GET /api/usuarios/{id}): nunca inclui e-mail. */
export interface Perfil {
  id: number;
  nome: string;
  foto?: string | null;
  bio?: string | null;
  totalPostagens: number;
}

/** Limite validado pela API (mantenha em sincronia com BioRequestDTO). */
export const LIMITE_BIO = 255;
