import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Selo de conta verificada (a da administração do site), ao lado do nome. Segue o visual zine: uma roseta roxa com
 * contorno grosso, sombra dura e um check branco. Acompanha o tamanho do texto ao redor (font-size), como um ícone.
 *
 * Uso: @if (usuario.verificado) { <app-selo-verificado /> }
 */
@Component({
  selector: 'app-selo-verificado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', 'aria-label': 'Conta verificada', title: 'Conta verificada' },
  template: `
    <svg viewBox="-1 -1 27 27" aria-hidden="true" focusable="false">
      <polygon class="sombra" transform="translate(1.6 1.6)" [attr.points]="roseta" />
      <polygon class="roseta" [attr.points]="roseta" />
      <path class="check" d="M7.4 12.3l3.1 3.1 6.1-6.6" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      flex: none;
      width: 1.05em;
      height: 1.05em;
      margin-left: 0.3em;
      line-height: 1;
      vertical-align: -0.15em;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .sombra {
      fill: var(--zine-sombra);
    }

    .roseta {
      fill: var(--zine-roxo);
      stroke: var(--zine-contorno);
      stroke-width: 1.6;
      stroke-linejoin: round;
    }

    .check {
      fill: none;
      stroke: #fff;
      stroke-width: 2.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `
})
export class SeloVerificadoComponent {
  /** Roseta de 12 pontas (centro 12,12), como um selo de carimbo. */
  protected readonly roseta =
    '12,1 14.3,3.4 17.5,2.47 18.29,5.71 21.53,6.5 20.6,9.7 23,12 20.6,14.3 21.53,17.5 18.29,18.29 17.5,21.53 ' +
    '14.3,20.6 12,23 9.7,20.6 6.5,21.53 5.71,18.29 2.47,17.5 3.4,14.3 1,12 3.4,9.7 2.47,6.5 5.71,5.71 6.5,2.47 9.7,3.4';
}
