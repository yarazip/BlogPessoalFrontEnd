import { Usuario } from './Usuario';

/** CURTIDA: alguém curtiu uma postagem sua. COMENTARIO: alguém comentou uma postagem sua. */
export type TipoNotificacao = 'CURTIDA' | 'COMENTARIO';

/** Aviso do sino (GET /notificacoes). */
export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  lida: boolean;
  data: Date | string;
  /** Quem curtiu ou comentou. */
  ator: Usuario;
  postagemId: number;
  /** Título da postagem ou, nos rabiscos, o começo do texto. */
  postagemResumo: string;
  /** Começo do comentário; só quando o tipo é COMENTARIO. */
  comentarioResumo?: string | null;
}
