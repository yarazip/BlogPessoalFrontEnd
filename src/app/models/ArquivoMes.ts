/** Um mês do arquivo de uma autora (GET /usuarios/{id}/arquivo): quantas postagens ela fez nele. */
export interface ArquivoMes {
  ano: number;
  /** De 1 a 12. */
  mes: number;
  total: number;
}
