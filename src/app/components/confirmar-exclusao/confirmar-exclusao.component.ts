import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

/**
 * Pergunta "excluir mesmo?" num modal, no lugar do `confirm()` do navegador. Quem usa controla `aberto`
 * e `excluindo` (enquanto a API apaga: os botões ficam travados e a janela não fecha por Esc, X ou clique
 * fora, para a pessoa não achar que cancelou algo que já está em andamento).
 *
 * O botão "Cancelar" recebe o foco ao abrir (a ação segura), e "Excluir" é vermelho.
 *
 *     <app-confirmar-exclusao
 *       [aberto]="postagemParaExcluir !== null"
 *       [excluindo]="excluindo"
 *       (confirmar)="excluirDeVerdade()"
 *       (cancelar)="postagemParaExcluir = null"
 *     />
 */
@Component({
  selector: 'app-confirmar-exclusao',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './confirmar-exclusao.component.html'
})
export class ConfirmarExclusaoComponent {
  readonly aberto = input(false);
  /** A exclusão está em andamento. */
  readonly excluindo = input(false);
  readonly titulo = input('Excluir esta postagem?');
  readonly texto = input('Esta ação não pode ser desfeita. A postagem some do mural e do seu perfil.');

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();

  /** Esc, X ou clique fora: só cancela se nada estiver em andamento. */
  pedirParaFechar(): void {
    if (!this.excluindo()) {
      this.cancelar.emit();
    }
  }
}
