// Gera src/assets/icons/sprite.svg a partir dos SVGs do Font Awesome Free (devDependency).
// Uso: npm run icons
//
// Para adicionar um ícone: inclua uma linha em ICONES, rode o script e acrescente o nome em
// src/app/shared/icon/icon-names.ts. O teste do sprite avisa se os dois ficarem fora de sincronia.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origem = join(raiz, 'node_modules/@fortawesome/fontawesome-free/svgs');
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

const conteudo = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Sprite de ícones. ARQUIVO GERADO por scripts/gerar-sprite.mjs (npm run icons): não edite à mão.
  Ícones: Font Awesome Free 6 (https://fontawesome.com), licença CC BY 4.0
  (https://creativecommons.org/licenses/by/4.0/). Copyright Fonticons, Inc.
-->
<svg xmlns="http://www.w3.org/2000/svg">
${simbolos.join('\n')}
</svg>
`;

mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, conteudo);
console.log(`sprite gerado com ${simbolos.length} ícones: ${destino}`);
