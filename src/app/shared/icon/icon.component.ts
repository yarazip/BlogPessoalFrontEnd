import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconName, SPRITE_URL } from './icon-names';

/**
 * Ícone do sprite SVG. Herda cor (currentColor) e tamanho (font-size) do texto ao redor, como uma
 * fonte de ícones; é decorativo (aria-hidden), então botões só com ícone precisam de aria-label.
 *
 * Uso: <app-icon name="plus" />
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg aria-hidden="true" focusable="false"><use [attr.href]="href()"></use></svg>`,
  styles: `
    :host {
      display: inline-block;
      width: 1em;
      height: 1em;
      line-height: 1;
      vertical-align: -0.125em;
    }

    /* O <svg> externo não tem viewBox: sem largura explícita o navegador usa 300px. O símbolo é
       encaixado e centralizado nesta caixa quadrada. */
    svg {
      display: block;
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
  `
})
export class IconComponent {
  readonly name = input.required<IconName>();

  protected readonly href = computed(() => `${SPRITE_URL}#icon-${this.name()}`);
}
