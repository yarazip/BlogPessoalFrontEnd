import { IconName } from './icon/icon-names';

/**
 * Emojis próprios da Rasura: desenhos no estilo do site (src/assets/icons/sprite.svg, gerados por
 * scripts/gerar-emojis.mjs). No texto da postagem eles ficam guardados como `:nome:` (por exemplo `:sorriso:`); quem
 * mostra o texto troca o código pelo desenho. O texto continua sendo só texto: a API não sabe nada de emojis, e nada
 * aqui vira HTML.
 */
export const EMOJIS = [
  { nome: 'sorriso', rotulo: 'Sorriso' },
  { nome: 'risada', rotulo: 'Risada' },
  { nome: 'triste', rotulo: 'Triste' },
  { nome: 'amor', rotulo: 'Coração' },
  { nome: 'estrela', rotulo: 'Estrela' },
  { nome: 'raio', rotulo: 'Raio' },
  { nome: 'fogo', rotulo: 'Fogo' },
  { nome: 'flor', rotulo: 'Flor' },
  { nome: 'lua', rotulo: 'Lua' },
  { nome: 'sol', rotulo: 'Sol' },
  { nome: 'nuvem', rotulo: 'Nuvem' },
  { nome: 'cafe', rotulo: 'Café' },
  { nome: 'livro', rotulo: 'Livro' },
  { nome: 'lapis', rotulo: 'Lápis' },
  { nome: 'nota', rotulo: 'Nota musical' },
  { nome: 'rasura', rotulo: 'Rasura' }
] as const;

export type Emoji = (typeof EMOJIS)[number];

/** Pedaço de um texto: letras comuns ou um emoji. */
export type Trecho = { tipo: 'texto'; texto: string } | { tipo: 'emoji'; emoji: Emoji };

const POR_NOME = new Map<string, Emoji>(EMOJIS.map(e => [e.nome, e]));
/** `:nome:` só com letras minúsculas: horas como "10:30:45" e endereços com porta não casam. */
const CODIGO = /:([a-z]+):/;

/** O código que vai no texto para o emoji. */
export function codigoDe(emoji: Emoji): string {
  return `:${emoji.nome}:`;
}

/** O ícone do sprite que desenha o emoji. */
export function iconeDe(emoji: Emoji): IconName {
  return `emoji-${emoji.nome}` as IconName;
}

/**
 * Divide o texto em trechos de texto e emojis. Um `:nome:` que não é de nenhum emoji conhecido continua sendo texto
 * (assim ninguém perde o que escreveu). Emendar os trechos de texto devolve exatamente o texto original, com os
 * códigos dos emojis no lugar dos desenhos.
 */
export function partirEmTrechos(texto: string): Trecho[] {
  const trechos: Trecho[] = [];
  let pendente = '';
  let fim = 0;

  let posicao = 0;
  while (posicao < texto.length) {
    const achado = CODIGO.exec(texto.slice(posicao));
    if (!achado) {
      break;
    }
    const inicio = posicao + achado.index;
    const emoji = POR_NOME.get(achado[1]);
    if (!emoji) {
      // código desconhecido: segue a partir do segundo ":", que pode ser o começo de um código conhecido (":a:sol:")
      posicao = inicio + 1;
      continue;
    }
    pendente += texto.slice(fim, inicio);
    if (pendente) {
      trechos.push({ tipo: 'texto', texto: pendente });
      pendente = '';
    }
    trechos.push({ tipo: 'emoji', emoji });
    fim = inicio + achado[0].length;
    posicao = fim;
  }

  pendente += texto.slice(fim);
  if (pendente) {
    trechos.push({ tipo: 'texto', texto: pendente });
  }
  return trechos;
}

/**
 * Coloca `trecho` no lugar da seleção (ou no cursor, quando início e fim coincidem). Devolve o texto novo e onde fica o
 * cursor depois do trecho, ou nulo se o resultado passaria do limite de caracteres (nada é alterado nesse caso).
 */
export function inserirNoTexto(
  texto: string,
  inicio: number,
  fim: number,
  trecho: string,
  limite: number
): { texto: string; cursor: number } | null {
  const de = Math.max(0, Math.min(inicio, fim, texto.length));
  const ate = Math.min(texto.length, Math.max(inicio, fim));
  const novo = texto.slice(0, de) + trecho + texto.slice(ate);
  return novo.length > limite ? null : { texto: novo, cursor: de + trecho.length };
}
