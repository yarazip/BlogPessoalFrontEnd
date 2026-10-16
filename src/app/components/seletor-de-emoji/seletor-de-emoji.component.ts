import { Component, ElementRef, HostListener, inject, output } from '@angular/core';
import { EMOJIS, Emoji, iconeDe } from '../../shared/emojis';
import { IconComponent } from '../../shared/icon/icon.component';

/**
 * Botão "Emoji" com a grade dos emojis da Rasura. Cada toque avisa qual foi escolhido (quem usa decide onde inserir) e a
 * grade continua aberta para escolher vários; fecha com Esc, clicando fora ou no próprio botão.
 *
 *     <app-seletor-de-emoji (escolher)="inserir($event)" />
 */
@Component({
  selector: 'app-seletor-de-emoji',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './seletor-de-emoji.component.html',
  styleUrls: ['./seletor-de-emoji.component.scss']
})
export class SeletorDeEmojiComponent {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly escolher = output<Emoji>();

  readonly emojis = EMOJIS;
  readonly icone = iconeDe;
  aberto = false;

  alternar(): void {
    this.aberto = !this.aberto;
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: Event): void {
    if (this.aberto && !this.elemento.nativeElement.contains(evento.target as Node)) {
      this.aberto = false;
    }
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    this.aberto = false;
  }
}
