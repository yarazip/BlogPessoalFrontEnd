/** Perfil público de uma pessoa (GET /api/usuarios/{id}): nunca inclui e-mail. */
export interface Perfil {
  id: number;
  nome: string;
  foto?: string | null;
  bio?: string | null;
  /** Música e livro do momento que a pessoa mostra no perfil (texto livre, opcionais). */
  musicaAtual?: string | null;
  livroAtual?: string | null;
  totalPostagens: number;
}

/** Limite de cada destaque (música e livro), validado pela API (DestaquesRequestDTO). */
export const LIMITE_DESTAQUE = 100;

/** Limite validado pela API (mantenha em sincronia com BioRequestDTO). */
export const LIMITE_BIO = 255;
