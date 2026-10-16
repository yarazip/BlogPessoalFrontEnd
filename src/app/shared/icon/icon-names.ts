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
  'envelope',
  'github',
  'linkedin',
  'list',
  'logout',
  'moon',
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
