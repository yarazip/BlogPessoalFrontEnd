import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { DateBrPipe } from '../../pipes/date-br.pipe';
import { PostagemService } from '../../services/postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { Postagem } from '../models/Postagem';

const POSTAGENS_POR_PAGINA = 10;

@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [CommonModule, DateBrPipe],
  templateUrl: './explorar.component.html',
  styleUrls: ['./explorar.component.scss']
})
export class ExplorarComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);

  postagens: Postagem[] = [];
  isLoading = true;
  carregandoMais = false;
  haMais = false;
  mensagemErro: string | null = null;

  private proximaPagina = 0;

  readonly fotoPadrao = 'assets/img/sem-foto.svg';

  ngOnInit(): void {
    this.carregar();
  }

  /** Busca a próxima página e a acrescenta ao feed. */
  carregarMais(): void {
    if (!this.carregandoMais && this.haMais) {
      this.carregar();
    }
  }

  private carregar(): void {
    const primeira = this.proximaPagina === 0;
    this.mensagemErro = null;
    this.carregandoMais = !primeira;

    this.postagemService.getPagina({ page: this.proximaPagina, size: POSTAGENS_POR_PAGINA }).subscribe({
      next: pagina => {
        this.postagens = [...this.postagens, ...pagina.conteudo];
        this.haMais = !pagina.ultima;
        this.proximaPagina = pagina.pagina + 1;
        this.isLoading = false;
        this.carregandoMais = false;
      },
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Não foi possível carregar as postagens.');
        this.isLoading = false;
        this.carregandoMais = false;
      }
    });
  }
}
