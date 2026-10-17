/** Perfil público de uma pessoa (GET /api/usuarios/{id}): nunca inclui e-mail. */
export interface Perfil {
  id: number;
  nome: string;
  foto?: string | null;
  bio?: string | null;
  /** Música e livro do momento que a pessoa mostra no perfil (texto livre, opcionais). */
  musicaAtual?: string | null;
  livroAtual?: string | null;
  /** Capa e prévia de 30 s escolhidas na busca (https de fontes conhecidas); ausentes se foi texto livre. */
  musicaCapa?: string | null;
  musicaPrevia?: string | null;
  livroCapa?: string | null;
  totalPostagens: number;
  /** Conta da administração do site: mostra o selo de verificado ao lado do nome. */
  verificado?: boolean;
  /** Humor do dia: uma frase curta que a pessoa mostra no perfil (opcional). */
  humor?: string | null;
}

/** Limite de cada destaque (música e livro), validado pela API (DestaquesRequestDTO). */
export const LIMITE_DESTAQUE = 100;

/** Limite do humor do dia, validado pela API (HumorRequestDTO). */
export const LIMITE_HUMOR = 60;

/** Limite validado pela API (mantenha em sincronia com BioRequestDTO). */
export const LIMITE_BIO = 255;
