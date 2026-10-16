import { Component, computed, input } from '@angular/core';
import { FontePostagem, pesoDoTituloDe, pilhaDe } from '../../models/Fonte';
import { TextoComEmojisComponent } from '../texto-com-emojis/texto-com-emojis.component';
import { previaDoTexto } from '../../shared/previa';

/**
 * Mostra, enquanto a pessoa escreve, como o rascunho vai aparecer no feed depois de publicado: título e texto cortado
 * com "Ler mais" (a mesma regra da API), na fonte escolhida. É só uma ilustração: nada aqui é enviado nem clicável.
 */
@Component({
  selector: 'app-previa-rascunho',
  standalone: true,
  imports: [TextoComEmojisComponent],
  templateUrl: './previa-rascunho.component.html',
  styleUrls: ['./previa-rascunho.component.scss']
})
export class PreviaRascunhoComponent {
  readonly titulo = input('');
  readonly texto = input('');
  /** Nome do tema escolhido, sem o "#". */
  readonly tema = input<string | null>(null);
  readonly fonte = input<FontePostagem | null>(null);
  readonly autor = input('Você');

  /** Ainda não há o que mostrar. */
  readonly vazia = computed(() => !this.titulo().trim() && !this.texto().trim());
  readonly noFeed = computed(() => previaDoTexto(this.texto()));
  readonly pilha = computed(() => pilhaDe(this.fonte()));
  readonly pesoDoTitulo = computed(() => pesoDoTituloDe(this.fonte()));
}
