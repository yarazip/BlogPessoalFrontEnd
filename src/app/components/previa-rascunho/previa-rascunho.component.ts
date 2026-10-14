import { Component, computed, input } from '@angular/core';
import { FontePostagem, pesoDoTituloDe, pilhaDe } from '../../models/Fonte';
import { minutosDeLeitura } from '../../shared/leitura';
import { previaDoTexto } from '../../shared/previa';

/**
 * Mostra, enquanto a pessoa escreve, como o rascunho vai aparecer depois de publicado: primeiro no feed (texto cortado
 * com "Ler mais", como a API faz) e depois na página da postagem (texto inteiro e tempo de leitura), na fonte escolhida.
 * É só uma ilustração: nada aqui é enviado nem clicável.
 */
@Component({
  selector: 'app-previa-rascunho',
  standalone: true,
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
  readonly minutos = computed(() => minutosDeLeitura(this.texto()));
  readonly pilha = computed(() => pilhaDe(this.fonte()));
  readonly pesoDoTitulo = computed(() => pesoDoTituloDe(this.fonte()));
}
