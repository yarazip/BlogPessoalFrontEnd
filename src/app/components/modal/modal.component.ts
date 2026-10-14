import { AfterViewInit, Component, DestroyRef, ElementRef, effect, inject, input, output, viewChild } from '@angular/core';

/** Para dar um id único ao título de cada modal (ligado ao diálogo por aria-labelledby). */
let proximoModal = 0;

export type LarguraDoModal = 'estreita' | 'media' | 'larga';

/**
 * Janela modal na identidade da Rasura (folha com borda grossa, sombra dura e fita adesiva).
 *
 * É "controlada" por quem usa: `aberto` diz se está na tela, e `fechar` avisa que a pessoa pediu para fechar
 * (Esc, X ou clique fora). Quem usa decide o que fazer, normalmente `aberto = false`.
 * Usa o `<dialog>` nativo: o foco fica preso dentro, o resto da página fica inerte, Esc funciona e o foco
 * volta ao botão que abriu. A rolagem da página é travada enquanto o modal está aberto.
 *
 * Uso:
 *
 *     <app-modal [aberto]="excluindo" titulo="Excluir postagem?" (fechar)="excluindo = false">
 *       <p>Esta ação não pode ser desfeita.</p>
 *       <ng-container modalAcoes>
 *         <button type="button" class="zine-botao" (click)="excluindo = false">Cancelar</button>
 *         <button type="button" class="zine-botao perigo" (click)="excluir()">Excluir</button>
 *       </ng-container>
 *     </app-modal>
 *
 * Ao abrir, o foco vai para o primeiro item focável (o X). Em ações destrutivas, marque o botão seguro com
 * `autofocus` (ex.: o "Cancelar") para o foco começar nele.
 *
 * O conteúdo vai no corpo; o que levar o atributo `modalAcoes` vai para o rodapé (botões à direita). Os botões
 * podem usar as classes globais `zine-botao`, `primario` e `perigo` (ver styles.scss).
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements AfterViewInit {
  /** O modal está na tela. */
  readonly aberto = input(false);
  /** Título (obrigatório: dá nome ao diálogo para leitores de tela). */
  readonly titulo = input.required<string>();
  readonly largura = input<LarguraDoModal>('media');
  /** Clicar na área escura em volta pede para fechar. Desligue para formulários em que não se pode perder o que foi digitado. */
  readonly fecharAoClicarFora = input(true);
  /** Mostra o botão X no canto. */
  readonly mostrarX = input(true);

  /** A pessoa pediu para fechar (Esc, X ou clique fora). Não fecha sozinho: quem usa muda `aberto`. */
  readonly fechar = output<void>();

  readonly idTitulo = `modal-titulo-${++proximoModal}`;

  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const aberto = this.aberto();
      const dialogo = this.dialogo().nativeElement;
      if (aberto && !dialogo.open) {
        dialogo.showModal();
      } else if (!aberto && dialogo.open) {
        dialogo.close();
      }
      document.body.classList.toggle('modal-aberto', aberto);
    });

    inject(DestroyRef).onDestroy(() => document.body.classList.remove('modal-aberto'));
  }

  /**
   * O clique na área escura é só um atalho para quem usa mouse (quem usa teclado tem Esc e o X), por isso o
   * ouvinte é ligado aqui e não no template, onde a regra de acessibilidade exigiria teclado no <dialog>.
   */
  ngAfterViewInit(): void {
    this.dialogo().nativeElement.addEventListener('click', evento => this.aoClicar(evento));
  }

  /** Esc: o navegador fecharia o diálogo por conta própria; aqui só avisamos e quem usa decide. */
  aoCancelar(evento: Event): void {
    evento.preventDefault();
    this.fechar.emit();
  }

  /** Clique na área escura (o alvo é o próprio <dialog>, não a folha dentro dele). */
  aoClicar(evento: MouseEvent): void {
    if (this.fecharAoClicarFora() && evento.target === this.dialogo().nativeElement) {
      this.fechar.emit();
    }
  }

  /** O diálogo foi fechado por fora do nosso controle (ex.: <form method="dialog">) enquanto `aberto` seguia verdadeiro. */
  aoFecharNativo(): void {
    if (this.aberto()) {
      this.fechar.emit();
    }
  }
}
