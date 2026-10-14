/** Palavras lidas por minuto, para o "x min de leitura" (média de leitura em português). */
const PALAVRAS_POR_MINUTO = 200;

/** Tempo de leitura em minutos, arredondado para cima e nunca menor que 1. */
export function minutosDeLeitura(texto: string): number {
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(palavras / PALAVRAS_POR_MINUTO));
}
