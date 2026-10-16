/** Uma página de resultados da API (GET /postagens/pagina). `pagina` começa em 0. */
export interface Pagina<T> {
  conteudo: T[];
  pagina: number;
  tamanho: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}

export interface OpcoesDePagina {
  page?: number;
  size?: number;
  autor?: number;
  tema?: number;
  /** Só as postagens deste mês, no formato "aaaa-mm" (o arquivo da autora). */
  mes?: string;
}
