import { Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { FONTES, Fonte, FontePostagem, fonteDe } from '../../models/Fonte';
import { ModalComponent } from '../modal/modal.component';

/**
 * Escolha da fonte do rascunho em um botão só: ele mostra a fonte atual (no próprio estilo dela) e, ao clicar,
 * abre uma janela com todas as opções, cada uma com um trecho de exemplo. Escolher fecha a janela.
 * Não substitui o controle: lê e grava no `controle` do formulário (nulo = a fonte padrão do site).
 */
@Component({
  selector: 'app-seletor-de-fonte',
  standalone: true,
  imports: [ModalComponent],
  templateUrl: './seletor-de-fonte.component.html',
  styleUrls: ['./seletor-de-fonte.component.scss']
})
export class SeletorDeFonteComponent {
  readonly controle = input.required<FormControl<FontePostagem | null>>();

  readonly fontes = FONTES;
  readonly exemplo = 'Era uma vez um rascunho torto.';
  aberto = false;

  /** A fonte escolhida agora (indefinida = a padrão do site). */
  get atual(): Fonte | undefined {
    return fonteDe(this.controle().value);
  }

  abrir(): void {
    this.aberto = true;
  }

  fechar(): void {
    this.aberto = false;
  }

  escolher(id: FontePostagem | null): void {
    const controle = this.controle();
    controle.setValue(id);
    controle.markAsDirty();
    this.aberto = false;
  }
}
