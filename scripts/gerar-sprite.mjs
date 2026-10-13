// Gera src/assets/icons/sprite.svg a partir dos SVGs do Font Awesome Free (devDependency) e dos
// desenhos próprios da pasta scripts/icones-proprios (um arquivo .svg por ícone; o nome do arquivo é o
// nome do ícone).
// Uso: npm run icons
//
// Para adicionar um ícone do Font Awesome: inclua uma linha em ICONES. Para um desenho próprio: ponha o .svg
// na pasta scripts/icones-proprios (use currentColor nas cores). Depois rode o script e acrescente o nome em
// src/app/shared/icon/icon-names.ts. O teste do sprite avisa se os dois ficarem fora de sincronia.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origem = join(raiz, 'node_modules/@fortawesome/fontawesome-free/svgs');
const proprios = join(raiz, 'scripts/icones-proprios');
const destino = join(raiz, 'src/assets/icons/sprite.svg');

/** nome usado no app -> arquivo do Font Awesome, em solid/ (padrão) ou brands/ (marcas) */
const ICONES = {
  'arrow-left': 'arrow-left',
  camera: 'camera',
  edit: 'pen-to-square',
  envelope: 'envelope',
  github: 'brands/github',
  linkedin: 'brands/linkedin',
  list: 'list',
  logout: 'right-from-bracket',
  moon: 'moon',
  plus: 'plus',
  sun: 'sun',
  tools: 'screwdriver-wrench',
  trash: 'trash',
  user: 'user'
};

const simbolos = Object.entries(ICONES).map(([nome, arquivo]) => {
  const caminho = arquivo.includes('/') ? arquivo : `solid/${arquivo}`;
  const svg = readFileSync(join(origem, `${caminho}.svg`), 'utf8');
  const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
  const caminhos = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/>/g)].map(m => m[1]);
  if (!viewBox || caminhos.length === 0) {
    throw new Error(`SVG inesperado: ${arquivo}`);
  }
  const paths = caminhos.map(d => `<path d="${d}"/>`).join('');
  return `  <symbol id="icon-${nome}" viewBox="${viewBox}">${paths}</symbol>`;
});

/** Desenhos próprios: o conteúdo do <svg> vira o <symbol>; o nome do arquivo é o nome do ícone. */
const simbolosProprios = readdirSync(proprios)
  .filter(arquivo => arquivo.endsWith('.svg'))
  .sort()
  .map(arquivo => {
    const nome = arquivo.replace(/\.svg$/, '');
    const svg = readFileSync(join(proprios, arquivo), 'utf8');
    const viewBox = /viewBox="([^"]+)"/.exec(svg)?.[1];
    const miolo = svg
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/>\s+</g, '><')
      .trim();
    if (!viewBox || !miolo.includes('<path d="')) {
      throw new Error(`SVG próprio inesperado: ${arquivo}`);
    }
    return `  <symbol id="icon-${nome}" viewBox="${viewBox}">${miolo}</symbol>`;
  });

const todos = [...simbolos, ...simbolosProprios];

const conteudo = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Sprite de ícones. ARQUIVO GERADO por scripts/gerar-sprite.mjs (npm run icons): não edite à mão.
  Ícones: Font Awesome Free 6 (https://fontawesome.com), licença CC BY 4.0
  (https://creativecommons.org/licenses/by/4.0/). Copyright Fonticons, Inc.
  Ícones coracao*: desenhos próprios do projeto (scripts/icones-proprios), sem licença de terceiros.
-->
<svg xmlns="http://www.w3.org/2000/svg">
${todos.join('\n')}
</svg>
`;

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, conteudo);
console.log(`sprite gerado com ${todos.length} ícones (${simbolosProprios.length} próprios): ${destino}`);
