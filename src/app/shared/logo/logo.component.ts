import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Nome do site, na fonte Mansalva (carregada em index.html). Herda cor e tamanho do texto ao redor,
 * então serve tanto no cabeçalho quanto no meio de uma frase.
 *
 * Uso: <app-logo />
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: 'Rasura',
  styles: `
    :host {
      font-family: 'Mansalva', cursive;
      font-weight: 400;
      line-height: 1;
      white-space: nowrap;
    }
  `
})
export class LogoComponent {}
