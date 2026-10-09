/**
 * Ícones disponíveis no sprite (src/assets/icons/sprite.svg). Para adicionar um, veja
 * scripts/gerar-sprite.mjs; o teste do sprite avisa se esta lista e o arquivo divergirem.
 */
export const ICON_NAMES = [
  'arrow-left',
  'camera',
  'edit',
  'list',
  'logout',
  'moon',
  'plus',
  'sun',
  'tools',
  'trash',
  'user'
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const SPRITE_URL = 'assets/icons/sprite.svg';
