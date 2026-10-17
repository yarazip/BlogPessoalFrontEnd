/** NOTA: um recado curto. FOTO: uma imagem, com legenda opcional. */
export type TipoPostit = 'NOTA' | 'FOTO';

/** Cor do papel do post-it (as do marca-texto e dos adesivos do site). */
export type CorPostit = 'AMARELO' | 'ROSA' | 'ROXO' | 'VERDE';

/** De que lado da tela os post-its aparecem na leitura. */
export type LadoDosPostits = 'ESQUERDA' | 'DIREITA';

/** Post-it colado ao lado de um rascunho (a API devolve e recebe neste formato). */
export interface Postit {
  tipo: TipoPostit;
  /** O recado (NOTA) ou a legenda da foto (FOTO, opcional). */
  texto?: string | null;
  /** Endereço da foto, só nos post-its de foto. */
  fotoUrl?: string | null;
  cor: CorPostit;
}

/** Limites validados pela API (PostitRequestDTO): mantenha em sincronia. */
export const MAXIMO_DE_POSTITS = 3;
export const LIMITE_RECADO_DO_POSTIT = 140;
export const LIMITE_LEGENDA_DO_POSTIT = 60;

export const CORES_DO_POSTIT: { id: CorPostit; nome: string; papel: string }[] = [
  { id: 'AMARELO', nome: 'Amarelo', papel: '#ffe35c' },
  { id: 'ROSA', nome: 'Rosa', papel: '#ff9ec4' },
  { id: 'ROXO', nome: 'Roxo', papel: '#d4c2ff' },
  { id: 'VERDE', nome: 'Verde', papel: '#b8f0c8' }
];

export function papelDaCor(cor: CorPostit): string {
  return CORES_DO_POSTIT.find(c => c.id === cor)?.papel ?? CORES_DO_POSTIT[0].papel;
}

/** Um post-it pronto para enviar? Recado precisa de texto; foto, de endereço. */
export function postitCompleto(postit: Postit): boolean {
  return postit.tipo === 'NOTA' ? !!postit.texto?.trim() : !!postit.fotoUrl;
}
