/** Tamanho da prévia de um rascunho no feed, em caracteres (o mesmo da API: PostagemDTO.TAMANHO_DA_PREVIA). */
export const TAMANHO_DA_PREVIA = 400;

export interface PreviaDoTexto {
  texto: string;
  /** O texto foi cortado: no feed aparece "Ler mais". */
  resumido: boolean;
}

/**
 * Como o rascunho aparece no feed: o texto longo é cortado no último espaço antes do limite (sem partir um emoji
 * ao meio), com reticências no fim. Segue a regra da API, para a prévia da tela de escrever bater com o feed de verdade.
 */
export function previaDoTexto(texto: string): PreviaDoTexto {
  if (texto.length <= TAMANHO_DA_PREVIA) {
    return { texto, resumido: false };
  }

  let fim = TAMANHO_DA_PREVIA;
  const ultimo = texto.charCodeAt(fim - 1);
  if (ultimo >= 0xd800 && ultimo <= 0xdbff) {
    fim--; // não termina no meio de um par substituto (emoji)
  }

  let corte = texto.slice(0, fim);
  const ultimoEspaco = corte.lastIndexOf(' ');
  if (ultimoEspaco > TAMANHO_DA_PREVIA / 2 && !/\s/.test(texto.charAt(fim))) {
    corte = corte.slice(0, ultimoEspaco);
  }
  return { texto: corte.trimEnd(), resumido: true };
}
