import { Postagem } from '../models/Postagem';

/**
 * Peças da barra lateral e do rodapé da página de leitura, calculadas a partir das postagens recentes da mesma autora
 * (a lista vem da API do mural, das mais novas para as mais antigas). Tudo aqui é puro e não chama a API.
 */

/** Quantas postagens da autora a página pede de uma vez (o máximo que a API entrega por página). */
export const POSTAGENS_DA_AUTORA = 50;

/** Quantos títulos aparecem em "mais da autora". */
export const MAXIMO_EM_MAIS_DA_AUTORA = 5;

/** Quantos temas aparecem na caixa de temas. */
export const MAXIMO_DE_TEMAS = 8;

/** Rascunho (blog) ou rabisco: o que não diz o tipo (respostas antigas da API) é rascunho. */
export function ehRascunho(postagem: Postagem): boolean {
  return (postagem.tipo ?? 'BLOG') === 'BLOG';
}

/** O que identifica a postagem numa lista: o título, ou, nos rabiscos (sem título), o começo do texto. */
export function rotuloDe(postagem: Postagem, tamanho = 60): string {
  const titulo = postagem.titulo?.trim();
  if (titulo) {
    return titulo;
  }
  const linha = (postagem.texto ?? '').trim().replace(/\s+/g, ' ');
  if (linha.length <= tamanho) {
    return linha;
  }
  let fim = tamanho;
  // não parte um emoji ao meio (par substituto UTF-16)
  if (/[\uD800-\uDBFF]/.test(linha.charAt(fim - 1))) {
    fim--;
  }
  return linha.slice(0, fim).trimEnd() + '…';
}

/**
 * A postagem anterior (mais antiga) e a próxima (mais nova) da mesma autora e do mesmo tipo: um rascunho navega entre
 * rascunhos, e um rabisco entre rabiscos. Vazio quando a postagem não está na lista (por exemplo, é muito antiga).
 */
export function vizinhasDe(
  lista: Postagem[],
  atualId: number,
  atualEhRascunho: boolean
): { anterior?: Postagem; proxima?: Postagem } {
  const mesmoTipo = lista.filter(p => ehRascunho(p) === atualEhRascunho);
  const posicao = mesmoTipo.findIndex(p => p.id === atualId);
  if (posicao === -1) {
    return {};
  }
  return { anterior: mesmoTipo[posicao + 1], proxima: mesmoTipo[posicao - 1] };
}

/** Os rascunhos mais recentes da autora, sem o que está sendo lido. */
export function maisDaAutora(lista: Postagem[], atualId: number, maximo = MAXIMO_EM_MAIS_DA_AUTORA): Postagem[] {
  return lista.filter(p => ehRascunho(p) && p.id !== atualId).slice(0, maximo);
}

export interface TemaContado {
  /** Já sem as aspas que alguns temas antigos trazem no banco. */
  nome: string;
  quantidade: number;
}

/** Os temas que a autora mais usa nos rascunhos, do mais usado para o menos usado (empates em ordem alfabética). */
export function temasDaAutora(lista: Postagem[], maximo = MAXIMO_DE_TEMAS): TemaContado[] {
  const contagem = new Map<string, number>();
  for (const postagem of lista) {
    const nome = postagem.tema?.descricao?.replace(/^['"]+|['"]+$/g, '').trim();
    if (nome) {
      contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
    }
  }
  return Array.from(contagem, ([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, maximo);
}
