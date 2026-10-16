// Gera os desenhos dos emojis da Rasura em scripts/icones-proprios/emoji-*.svg (um arquivo por emoji). Depois é só
// rodar `npm run icons` para entrarem no sprite e acrescentar os nomes em src/app/shared/icon/icon-names.ts
// (o teste do sprite avisa se esquecer).
//
// O estilo é o do resto do site: contorno de caneta em traço duplo (um grosso e um fino, deslocado, como se a linha
// tivesse sido passada duas vezes) e, quando há cor, um "marca-texto" levemente fora do lugar, atrás do contorno.
// Para mudar um desenho, edite aqui e rode:  node scripts/gerar-emojis.mjs && npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = join(dirname(fileURLToPath(import.meta.url)), 'icones-proprios');
mkdirSync(pasta, { recursive: true });

const AMARELO = '#ffe35c';
const LARANJA = '#ff7a2f';
const ROSA = '#ff9ec4';
const VERMELHO = '#ff6b6b';
const ROXO = '#b79bff';
const CLARO = '#f4efe2';
const AZUL = '#bfe0ff';

/**
 * Cada emoji: `cor` (marca-texto, atrás), `contorno` (caminhos com traço duplo) e `extra` (SVG solto já pronto,
 * por cima de tudo: olhos, pupilas, linhas internas).
 */
const EMOJIS = {
  sorriso: {
    cor: [{ d: 'M32 7C46 6 58 17 57 32C56 47 45 58 31 57C17 56 6 45 7 31C8 17 18 8 32 7Z', fill: AMARELO }],
    contorno: ['M32 7C46 6 58 17 57 32C56 47 45 58 31 57C17 56 6 45 7 31C8 17 18 8 32 7Z', 'M20 38C26 48 38 48 44 38'],
    extra: '<circle cx="23" cy="26" r="3.4" fill="currentColor"/><circle cx="41" cy="26" r="3.4" fill="currentColor"/>'
  },
  triste: {
    cor: [{ d: 'M32 7C46 6 58 17 57 32C56 47 45 58 31 57C17 56 6 45 7 31C8 17 18 8 32 7Z', fill: AMARELO }],
    contorno: ['M32 7C46 6 58 17 57 32C56 47 45 58 31 57C17 56 6 45 7 31C8 17 18 8 32 7Z', 'M21 46C27 37 37 37 43 46'],
    extra: '<circle cx="23" cy="26" r="3.4" fill="currentColor"/><circle cx="41" cy="26" r="3.4" fill="currentColor"/><path d="M45 33C47 36 47 39 45 40C43 39 43 36 45 33Z" fill="#7ec8ff" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
  },
  risada: {
    cor: [{ d: 'M32 7C46 6 58 17 57 32C56 47 45 58 31 57C17 56 6 45 7 31C8 17 18 8 32 7Z', fill: AMARELO }],
    contorno: [
      'M32 7C46 6 58 17 57 32C56 47 45 58 31 57C17 56 6 45 7 31C8 17 18 8 32 7Z',
      'M16 27C19 21 25 21 28 27',
      'M36 27C39 21 45 21 48 27',
      'M18 36L46 36C45 49 38 54 32 54C26 54 19 49 18 36Z'
    ],
    extra: '<path d="M22 45C27 42 37 42 42 45C40 50 36 52 32 52C28 52 24 50 22 45Z" fill="#ff6b6b"/>'
  },
  amor: {
    cor: [{ d: 'M33 57C22 47 6 36 7 24C8 12 24 7 32 21C38 8 57 11 57 26C58 38 42 49 30 58Z', fill: VERMELHO }],
    contorno: ['M33 57C22 47 6 36 7 24C8 12 24 7 32 21C38 8 57 11 57 26C58 38 42 49 30 58Z'],
    extra: '<path d="M16 22C17 17 21 15 25 17" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>'
  },
  estrela: {
    cor: [{ d: 'M32 5L38.5 23.1L57.7 23.7L42.5 35.4L47.9 53.8L32 43L16.1 53.8L21.5 35.4L6.3 23.7L25.5 23.1Z', fill: AMARELO }],
    contorno: ['M32 5L38.5 23.1L57.7 23.7L42.5 35.4L47.9 53.8L32 43L16.1 53.8L21.5 35.4L6.3 23.7L25.5 23.1Z'],
    extra: ''
  },
  raio: {
    cor: [{ d: 'M37 5L14 35L30 35L24 59L50 26L33 26Z', fill: AMARELO }],
    contorno: ['M37 5L14 35L30 35L24 59L50 26L33 26Z'],
    extra: ''
  },
  fogo: {
    cor: [
      { d: 'M32 5C34 16 46 22 46 38C46 50 40 58 32 58C23 58 17 51 17 41C17 34 21 30 24 26C25 31 28 33 30 33C28 24 29 14 32 5Z', fill: LARANJA },
      { d: 'M32 58C27 58 24 54 24 49C24 44 28 42 30 38C33 42 38 44 38 50C38 55 35 58 32 58Z', fill: AMARELO }
    ],
    contorno: ['M32 5C34 16 46 22 46 38C46 50 40 58 32 58C23 58 17 51 17 41C17 34 21 30 24 26C25 31 28 33 30 33C28 24 29 14 32 5Z'],
    extra: ''
  },
  flor: {
    cor: [
      { d: 'M32 7a10 10 0 1 0 0.1 0Z', fill: ROSA },
      { d: 'M46 17a10 10 0 1 0 0.1 0Z', fill: ROSA },
      { d: 'M41 34a10 10 0 1 0 0.1 0Z', fill: ROSA },
      { d: 'M23 34a10 10 0 1 0 0.1 0Z', fill: ROSA },
      { d: 'M18 17a10 10 0 1 0 0.1 0Z', fill: ROSA }
    ],
    contorno: [
      'M32 7a10 10 0 1 0 0.1 0Z',
      'M46 17a10 10 0 1 0 0.1 0Z',
      'M41 34a10 10 0 1 0 0.1 0Z',
      'M23 34a10 10 0 1 0 0.1 0Z',
      'M18 17a10 10 0 1 0 0.1 0Z'
    ],
    extra: `<circle cx="32" cy="32" r="8" fill="${AMARELO}" stroke="currentColor" stroke-width="3.2"/><path d="M32 40L31 58" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>`
  },
  lua: {
    cor: [{ d: 'M42 6C28 8 18 19 18 33C18 47 29 58 43 58C49 58 54 56 58 52C52 54 46 52 41 47C34 40 33 29 38 20C40 14 41 10 42 6Z', fill: AMARELO }],
    contorno: ['M42 6C28 8 18 19 18 33C18 47 29 58 43 58C49 58 54 56 58 52C52 54 46 52 41 47C34 40 33 29 38 20C40 14 41 10 42 6Z'],
    extra: ''
  },
  sol: {
    cor: [{ d: 'M32 19a13 13 0 1 0 0.1 0Z', fill: AMARELO }],
    contorno: [
      'M32 19a13 13 0 1 0 0.1 0Z',
      'M50 32L59 32',
      'M44.7 44.7L51.1 51.1',
      'M32 50L32 59',
      'M19.3 44.7L12.9 51.1',
      'M14 32L5 32',
      'M19.3 19.3L12.9 12.9',
      'M32 14L32 5',
      'M44.7 19.3L51.1 12.9'
    ],
    extra: ''
  },
  nuvem: {
    cor: [{ d: 'M18 46C9 46 6 36 13 32C12 22 24 16 31 23C36 16 50 20 49 31C58 32 58 46 49 46Z', fill: AZUL }],
    contorno: ['M18 46C9 46 6 36 13 32C12 22 24 16 31 23C36 16 50 20 49 31C58 32 58 46 49 46Z'],
    extra: ''
  },
  cafe: {
    cor: [{ d: 'M12 24L12 40C12 50 20 56 29 56L33 56C42 56 48 50 48 40L48 24Z', fill: CLARO }],
    contorno: [
      'M12 24L12 40C12 50 20 56 29 56L33 56C42 56 48 50 48 40L48 24Z',
      'M48 28C58 27 60 40 50 43',
      'M22 18C18 14 26 12 22 6',
      'M35 18C31 14 39 12 35 6'
    ],
    extra: `<path d="M13 28L47 28L47 33L13 33Z" fill="${LARANJA}" opacity="0.85"/>`
  },
  livro: {
    cor: [
      { d: 'M6 14C16 11 26 12 32 18L32 54C26 48 16 47 6 50Z', fill: CLARO },
      { d: 'M58 14C48 11 38 12 32 18L32 54C38 48 48 47 58 50Z', fill: AMARELO }
    ],
    contorno: ['M6 14C16 11 26 12 32 18L32 54C26 48 16 47 6 50Z', 'M58 14C48 11 38 12 32 18L32 54C38 48 48 47 58 50Z'],
    extra: '<path d="M12 22C17 21 22 21 26 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/><path d="M12 30C17 29 22 29 26 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/><path d="M38 24C42 21 47 21 52 22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/><path d="M38 32C42 29 47 29 52 30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/>'
  },
  lapis: {
    cor: [
      { d: 'M44 8L56 20L24 52L10 54L12 40Z', fill: AMARELO },
      { d: 'M12 40L24 52L10 54Z', fill: ROSA }
    ],
    contorno: ['M44 8L56 20L24 52L10 54L12 40Z', 'M38 14L50 26', 'M12 40L24 52'],
    extra: ''
  },
  nota: {
    cor: [{ d: 'M14 48C14 42 24 40 30 44C32 50 24 56 17 54C15 53 14 51 14 48Z', fill: ROXO }],
    contorno: ['M14 48C14 42 24 40 30 44C32 50 24 56 17 54C15 53 14 51 14 48Z', 'M30 45L30 11', 'M30 11C38 15 46 17 48 27'],
    extra: ''
  },
  rasura: {
    cor: [{ d: 'M6 40L58 28L59 38L7 50Z', fill: AMARELO }],
    contorno: [],
    extra: `<path d="M6 36C18 24 30 44 42 30C48 24 54 28 58 22" fill="none" stroke="${LARANJA}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 46C22 36 30 54 56 40" fill="none" stroke="${LARANJA}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 16C20 12 36 12 56 14" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity="0.9"/><path d="M10 56C24 52 40 52 54 54" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`
  }
};

const tracoGrosso = 'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"';
const tracoFino = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"';

for (const [nome, e] of Object.entries(EMOJIS)) {
  const linhas = [];
  // o marca-texto sai um pouco fora do contorno, como pintado depois
  for (const c of e.cor) {
    linhas.push(`  <path d="${c.d}" fill="${c.fill}" transform="translate(1.6 1.6)"/>`);
  }
  for (const d of e.contorno) {
    linhas.push(`  <path d="${d}" ${tracoGrosso}/>`);
    linhas.push(`  <path d="${d}" ${tracoFino} transform="translate(-1.1 0.9)"/>`);
  }
  if (e.extra) {
    linhas.push(`  ${e.extra}`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">\n${linhas.join('\n')}\n</svg>\n`;
  writeFileSync(join(pasta, `emoji-${nome}.svg`), svg);
}

console.log(`${Object.keys(EMOJIS).length} emojis gerados em ${pasta}`);
console.log('nomes:', Object.keys(EMOJIS).map(n => `'emoji-${n}'`).join(', '));
