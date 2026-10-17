/** Maior nome de tema aceito pela tela (a API aceita até 255, mas um tema é uma etiqueta curta). */
export const LIMITE_NOME_DE_TEMA = 40;

/** Nome do tema sem as aspas que alguns temas antigos têm no banco (ex.: 'Tecnologia'). */
export function nomeDoTema(descricao?: string | null): string {
  return (descricao ?? '').replace(/^['"]+|['"]+$/g, '').trim();
}

/**
 * Forma de comparar nomes de tema: sem acento, sem maiúsculas e com os espaços arrumados. Assim "Café", "cafe" e
 * " CAFÉ " são o mesmo tema, e a busca encontra sem a pessoa se preocupar com acentos.
 */
export function normalizarTema(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
