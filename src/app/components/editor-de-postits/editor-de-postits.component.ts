import { Component, inject, input, output } from '@angular/core';
import {
  CORES_DO_POSTIT,
  CorPostit,
  LIMITE_LEGENDA_DO_POSTIT,
  LIMITE_RECADO_DO_POSTIT,
  LadoDosPostits,
  MAXIMO_DE_POSTITS,
  Postit,
  papelDaCor,
  postitCompleto
} from '../../models/Postit';
import { PostagemService } from '../../services/postagem.service';
import { TAMANHO_MAXIMO_FOTO, TIPOS_FOTO_PERMITIDOS } from '../../shared/foto';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/**
 * Onde a autora cola de 0 a 3 post-its ao lado do rascunho: recados curtos ou fotos (com legenda), em quatro cores, e
 * escolhe de que lado da tela eles aparecem na leitura. A lista e o lado vêm de quem usa e voltam pelos eventos
 * (`postitsChange`, `ladoChange`); quem salva o rascunho é quem usa.
 *
 *     <app-editor-de-postits [postits]="postits" [lado]="lado" (postitsChange)="postits = $event" (ladoChange)="lado = $event" />
 */
@Component({
  selector: 'app-editor-de-postits',
  standalone: true,
  templateUrl: './editor-de-postits.component.html',
  styleUrls: ['./editor-de-postits.component.scss']
})
export class EditorDePostitsComponent {
  private readonly postagemService = inject(PostagemService);

  readonly postits = input<Postit[]>([]);
  readonly lado = input<LadoDosPostits>('DIREITA');

  readonly postitsChange = output<Postit[]>();
  readonly ladoChange = output<LadoDosPostits>();

  readonly maximo = MAXIMO_DE_POSTITS;
  readonly limiteRecado = LIMITE_RECADO_DO_POSTIT;
  readonly limiteLegenda = LIMITE_LEGENDA_DO_POSTIT;
  readonly cores = CORES_DO_POSTIT;
  readonly papelDaCor = papelDaCor;
  readonly postitCompleto = postitCompleto;
  readonly tiposDeFoto = TIPOS_FOTO_PERMITIDOS.join(',');

  /** Posição do post-it cuja foto está sendo enviada (nulo = nenhum). */
  enviando: number | null = null;
  erro: string | null = null;

  get cabeMais(): boolean {
    return this.postits().length < this.maximo;
  }

  /** Cada novo post-it ganha a próxima cor da lista, para não saírem todos amarelos. */
  adicionar(tipo: 'NOTA' | 'FOTO'): void {
    if (!this.cabeMais) {
      return;
    }
    const cor = this.cores[this.postits().length % this.cores.length].id;
    this.emitir([...this.postits(), tipo === 'NOTA' ? { tipo, texto: '', cor } : { tipo, fotoUrl: null, texto: '', cor }]);
  }

  remover(indice: number): void {
    this.erro = null;
    this.emitir(this.postits().filter((_, i) => i !== indice));
  }

  mover(indice: number, deslocamento: -1 | 1): void {
    const destino = indice + deslocamento;
    if (destino < 0 || destino >= this.postits().length) {
      return;
    }
    const lista = [...this.postits()];
    [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
    this.emitir(lista);
  }

  mudarCor(indice: number, cor: CorPostit): void {
    this.alterar(indice, { cor });
  }

  digitar(indice: number, evento: Event): void {
    this.alterar(indice, { texto: (evento.target as HTMLTextAreaElement | HTMLInputElement).value });
  }

  escolherLado(lado: LadoDosPostits): void {
    this.ladoChange.emit(lado);
  }

  /** Confere o arquivo, envia para a API (que devolve o endereço da foto) e cola a foto no post-it. */
  escolherFoto(indice: number, evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const arquivo = entrada.files?.[0];
    entrada.value = ''; // permite escolher o mesmo arquivo de novo depois de um erro
    this.erro = null;

    if (!arquivo) {
      return;
    }
    if (!TIPOS_FOTO_PERMITIDOS.includes(arquivo.type)) {
      this.erro = 'Formato não suportado. Envie JPG, PNG, WEBP, GIF ou AVIF.';
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      this.erro = 'Arquivo muito grande. O tamanho máximo permitido é 5MB.';
      return;
    }

    this.enviando = indice;
    this.postagemService.enviarFotoDePostit(arquivo).subscribe({
      next: resposta => {
        this.enviando = null;
        this.alterar(indice, { fotoUrl: resposta.url });
      },
      error: erro => {
        this.enviando = null;
        this.erro = mensagemDeErro(erro, 'Não foi possível enviar a foto. Tente novamente.');
      }
    });
  }

  private alterar(indice: number, mudanca: Partial<Postit>): void {
    this.emitir(this.postits().map((p, i) => (i === indice ? { ...p, ...mudanca } : p)));
  }

  private emitir(lista: Postit[]): void {
    this.postitsChange.emit(lista);
  }
}
