/**
 * Ícones disponíveis no sprite (src/assets/icons/sprite.svg). Para adicionar um, veja
 * scripts/gerar-sprite.mjs; o teste do sprite avisa se esta lista e o arquivo divergirem.
 */
export const ICON_NAMES = [
  'arrow-left',
  'balao',
  'camera',
  'coracao',
  'coracao-cheio',
  'coracao-partido',
  'coracao-partido-cheio',
  'edit',
  'ellipsis',
  'emoji-amor',
  'emoji-cafe',
  'emoji-estrela',
  'emoji-flor',
  'emoji-fogo',
  'emoji-lapis',
  'emoji-livro',
  'emoji-lua',
  'emoji-nota',
  'emoji-nuvem',
  'emoji-raio',
  'emoji-rasura',
  'emoji-risada',
  'emoji-sol',
  'emoji-sorriso',
  'emoji-triste',
  'envelope',
  'github',
  'linkedin',
  'list',
  'logout',
  'moon',
  'sino',
  'olho',
  'olho-riscado',
  'plus',
  'sun',
  'tools',
  'trash',
  'user'
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const SPRITE_URL = 'assets/icons/sprite.svg';
