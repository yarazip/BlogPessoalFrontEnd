import { Tema } from './Tema';
import { Usuario } from './Usuario';

/** Postagem como a API devolve. */
export interface Postagem {
  id?: number;
  titulo: string;
  texto: string;
  data?: Date | string;
  tema?: Tema;
  usuario?: Usuario;
}

/** Dados enviados para criar ou atualizar uma postagem. */
export interface PostagemRequest {
  titulo: string;
  texto: string;
  idTema: number;
}

/** Limites validados pela API (mantenha em sincronia com PostagemRequestDTO). */
export const LIMITES_POSTAGEM = {
  tituloMin: 5,
  tituloMax: 100,
  textoMin: 10,
  textoMax: 1000
} as const;
