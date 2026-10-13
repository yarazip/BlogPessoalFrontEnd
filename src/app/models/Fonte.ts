/**
 * Fontes que a autora de um rascunho (postagem de blog) pode escolher. Espelha FontePostagem no back-end:
 * ao incluir uma fonte, inclua nos dois lados. Nulo significa a fonte padrão do site.
 */
export type FontePostagem =
  | 'INSTRUMENT_SERIF'
  | 'FRAUNCES'
  | 'RIGHTEOUS'
  | 'RYE'
  | 'MEA_CULPA'
  | 'RUBIK_VINYL'
  | 'RAMPART_ONE';

export interface Fonte {
  id: FontePostagem;
  nome: string;
  /** Valor de font-family, com uma alternativa genérica enquanto a fonte não carrega. */
  pilha: string;
  /** Valor do parâmetro "family" da API css2 do Google Fonts. */
  google: string;
  /**
   * Peso do título. Fontes de peso único ficam feias com negrito sintetizado pelo navegador,
   * então só a Fraunces (que tem 700 de verdade) usa negrito.
   */
  pesoDoTitulo: 400 | 700;
}

export const FONTES: readonly Fonte[] = [
  { id: 'INSTRUMENT_SERIF', nome: 'Instrument Serif', pilha: "'Instrument Serif', serif", google: 'Instrument+Serif', pesoDoTitulo: 400 },
  { id: 'FRAUNCES', nome: 'Fraunces', pilha: "'Fraunces', serif", google: 'Fraunces:wght@400;700', pesoDoTitulo: 700 },
  { id: 'RIGHTEOUS', nome: 'Righteous', pilha: "'Righteous', sans-serif", google: 'Righteous', pesoDoTitulo: 400 },
  { id: 'RYE', nome: 'Rye', pilha: "'Rye', serif", google: 'Rye', pesoDoTitulo: 400 },
  { id: 'MEA_CULPA', nome: 'Mea Culpa', pilha: "'Mea Culpa', cursive", google: 'Mea+Culpa', pesoDoTitulo: 400 },
  { id: 'RUBIK_VINYL', nome: 'Rubik Vinyl', pilha: "'Rubik Vinyl', sans-serif", google: 'Rubik+Vinyl', pesoDoTitulo: 400 },
  { id: 'RAMPART_ONE', nome: 'Rampart One', pilha: "'Rampart One', sans-serif", google: 'Rampart+One', pesoDoTitulo: 400 }
];

export function fonteDe(id: FontePostagem | null | undefined): Fonte | undefined {
  return id ? FONTES.find(f => f.id === id) : undefined;
}

/** font-family da fonte escolhida, ou null para a padrão do site (o estilo some e o CSS normal vale). */
export function pilhaDe(id: FontePostagem | null | undefined): string | null {
  return fonteDe(id)?.pilha ?? null;
}

/** Peso do título na fonte escolhida, ou null para a padrão do site. */
export function pesoDoTituloDe(id: FontePostagem | null | undefined): number | null {
  return fonteDe(id)?.pesoDoTitulo ?? null;
}
