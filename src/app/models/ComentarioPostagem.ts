import { Usuario } from './Usuario';

/**
 * Comentário que uma pessoa deixa embaixo de uma postagem (GET /postagens/{id}/comentarios). Não confundir com o tipo de
 * postagem 'COMENTARIO' (o rabisco): aquele é uma postagem curta no mural.
 */
export interface ComentarioPostagem {
  id: number;
  texto: string;
  data: Date | string;
  usuario?: Usuario;
  /** A API diz se quem pergunta pode apagar: autora do comentário, dona da postagem ou administradora. */
  podeExcluir: boolean;
}

/** Tamanho máximo do comentário (ComentarioRequestDTO). */
export const LIMITE_COMENTARIO_POSTAGEM = 280;
