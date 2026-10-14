/** Um resultado da busca de música ou de livro, já no formato que o perfil guarda. */
export interface ItemDeBusca {
  /** Nome da música ou do livro. */
  titulo: string;
  /** Artista ou autor. */
  detalhe: string;
  /** Capa (https), quando a fonte tem. */
  capa: string | null;
  /** Prévia de áudio de 30 segundos (só música), quando a fonte tem. */
  previa: string | null;
}

/** Texto que fica salvo no perfil e aparece na tela: "Título - Artista", cortado no limite do campo. */
export function textoDoItem(item: ItemDeBusca, limite: number): string {
  const texto = item.detalhe ? `${item.titulo} - ${item.detalhe}` : item.titulo;
  return texto.length > limite ? `${texto.slice(0, limite - 1).trimEnd()}…` : texto;
}
