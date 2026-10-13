import { Tema } from './Tema';
import { Usuario } from './Usuario';

/** COMENTARIO: texto curto, sem título, direto no feed. BLOG: título e texto longo, com prévia no feed. */
export type TipoPostagem = 'COMENTARIO' | 'BLOG';

/** Postagem como a API devolve. */
export interface Postagem {
  id?: number;
  /** Ausente em respostas antigas da API: nesse caso é um blog. */
  tipo?: TipoPostagem;
  /** Vazio nos comentários. */
  titulo?: string | null;
  texto: string;
  /** true quando o texto é só a prévia (listas do feed); o texto inteiro vem em GET /postagens/{id}. */
  resumido?: boolean;
  data?: Date | string;
  tema?: Tema | null;
  usuario?: Usuario;
}

/** Dados enviados para criar ou atualizar uma postagem. */
export interface PostagemRequest {
  tipo?: TipoPostagem;
  titulo?: string;
  texto: string;
  idTema?: number;
}

/** Limites do blog validados pela API (mantenha em sincronia com PostagemRequestDTO.LIMITES). */
export const LIMITES_POSTAGEM = {
  tituloMin: 5,
  tituloMax: 100,
  textoMin: 10,
  textoMax: 10000
} as const;

/** Tamanho máximo de um comentário (PostagemRequestDTO.LIMITES.COMENTARIO_TEXTO_MAX). */
export const LIMITE_COMENTARIO = 280;
