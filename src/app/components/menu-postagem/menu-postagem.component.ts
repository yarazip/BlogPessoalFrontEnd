import { ChangeDetectorRef, Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';

/**
 * Menu de três pontinhos de uma postagem, com Editar e Excluir. Quem decide mostrá-lo é quem usa o componente
 * (só nas postagens da própria pessoa); a API também exige ser a autora. Editar leva ao formulário; Excluir
 * apenas avisa (`excluir`), e quem usa confirma e apaga.
 *
 * Teclado: Enter abre e foca o primeiro item, as setas percorrem os itens, Esc fecha e devolve o foco ao botão.
 */
@Component({
  selector: 'app-menu-postagem',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './menu-postagem.component.html',
  styleUrls: ['./menu-postagem.component.scss']
})
export class MenuPostagemComponent {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly detector = inject(ChangeDetectorRef);

  readonly postagemId = input.required<number>();
  /** Trecho da postagem, só para o nome do botão lido por leitores de tela. */
  readonly rotulo = input('');
  readonly excluir = output<void>();

  aberto = false;

  @ViewChild('botao') private botao?: ElementRef<HTMLButtonElement>;
  @ViewChildren('item') private itens?: QueryList<ElementRef<HTMLElement>>;

  get nomeDoBotao(): string {
    return this.rotulo() ? `Opções da postagem: ${this.rotulo()}` : 'Opções da postagem';
  }

  alternar(): void {
    if (this.aberto) {
      this.fechar();
      return;
    }
    this.aberto = true;
    this.detector.detectChanges(); // o menu só existe no DOM depois disso, e precisa de foco já
    this.itens?.first?.nativeElement.focus();
  }

  fechar(devolverFoco = false): void {
    this.aberto = false;
    if (devolverFoco) {
      this.botao?.nativeElement.focus();
    }
  }

  pedirExclusao(): void {
    this.fechar();
    this.excluir.emit();
  }

  @HostListener('document:click', ['$event'])
  aoClicarEmQualquerLugar(evento: Event): void {
    if (this.aberto && !this.elemento.nativeElement.contains(evento.target as Node)) {
      this.fechar();
    }
  }

  @HostListener('keydown', ['$event'])
  aoTeclar(evento: KeyboardEvent): void {
    if (!this.aberto) {
      return;
    }

    switch (evento.key) {
      case 'Escape':
        evento.preventDefault();
        this.fechar(true);
        break;
      case 'Tab':
        this.fechar(); // o foco segue o seu caminho normal, fora do menu
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        evento.preventDefault();
        this.moverFoco(evento.key === 'ArrowDown' ? 1 : -1);
        break;
    }
  }

  private moverFoco(passo: 1 | -1): void {
    const itens = this.itens?.toArray().map(i => i.nativeElement) ?? [];
    if (itens.length === 0) {
      return;
    }
    const atual = itens.indexOf(document.activeElement as HTMLElement);
    itens[(atual + passo + itens.length) % itens.length].focus();
  }
}
