import { Component, computed, input } from '@angular/core';
import { IconComponent } from '../../shared/icon/icon.component';
import { iconeDe, partirEmTrechos } from '../../shared/emojis';

/**
 * Mostra um texto trocando os códigos `:nome:` pelos emojis desenhados da Rasura. Tudo sai como texto comum e ícones
 * (nunca HTML do texto), então não abre brecha para código malicioso. Fica "em linha": quem usa define o estilo do
 * parágrafo (fonte, quebra de linha), e o texto continua igual ao original para quem seleciona e copia.
 *
 *     <p class="texto-postagem"><app-texto-com-emojis [texto]="postagem.texto" /></p>
 */
@Component({
  selector: 'app-texto-com-emojis',
  standalone: true,
  imports: [IconComponent],
  // uma linha só e sem espaços entre os elementos: o <p> que usa tem white-space: pre-line, e qualquer espaço a mais viraria texto
  template: `@for (t of trechos(); track $index) {@if (t.tipo === 'texto') {<span>{{ t.texto }}</span>} @else {<app-icon class="emoji" role="img" [attr.aria-label]="t.emoji.rotulo" [name]="icone(t.emoji)" />}}`,
  styles: `
    :host {
      display: inline;
    }

    /* o ícone se dimensiona pela fonte (1em): aumentar o font-size deixa o desenho maior que a letra, como um emoji comum */
    .emoji {
      margin: 0 0.04em;
      font-size: 1.55em;
      vertical-align: -0.28em;
    }
  `
})
export class TextoComEmojisComponent {
  readonly texto = input<string | null | undefined>('');

  protected readonly trechos = computed(() => partirEmTrechos(this.texto() ?? ''));
  protected readonly icone = iconeDe;
}
