/** Palavras lidas por minuto, para o "x min de leitura" (média de leitura em português). */
const PALAVRAS_POR_MINUTO = 200;

/** Quantas palavras tem o texto (espaços e quebras de linha repetidos não contam). */
export function contarPalavras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

/** Tempo de leitura em minutos, arredondado para cima e nunca menor que 1. */
export function minutosDeLeitura(texto: string): number {
  return Math.max(1, Math.ceil(contarPalavras(texto) / PALAVRAS_POR_MINUTO));
}
