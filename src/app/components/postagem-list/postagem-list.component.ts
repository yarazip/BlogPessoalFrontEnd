import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DateBrPipe } from '../../pipes/date-br.pipe';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { TruncatePipe } from '../../shared/pipes/truncate.pipe';
import { Postagem } from '../models/Postagem';

const POSTAGENS_POR_PAGINA = 10;

@Component({
  selector: 'app-postagem-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DateBrPipe, TruncatePipe],
  templateUrl: './postagem-list.component.html',
  styleUrls: ['./postagem-list.component.scss']
})
export class PostagemListComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);
  private readonly authService = inject(AuthService);

  postagens: Postagem[] = [];
  isLoading = true;
  carregandoMais = false;
  haMais = false;
  mensagemErro: string | null = null;

  private proximaPagina = 0;
  private usuarioId?: number;

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) {
      this.isLoading = false;
      return;
    }

    this.usuarioId = usuario.id;
    this.carregar();
  }

  /** Busca a próxima página e a acrescenta à lista. */
  carregarMais(): void {
    if (!this.carregandoMais && this.haMais) {
      this.carregar();
    }
  }

  private carregar(): void {
    const primeira = this.proximaPagina === 0;
    this.mensagemErro = null;
    this.carregandoMais = !primeira;

    this.postagemService
      .getPagina({ page: this.proximaPagina, size: POSTAGENS_POR_PAGINA, autor: this.usuarioId })
      .subscribe({
        next: pagina => {
          this.postagens = [...this.postagens, ...pagina.conteudo];
          this.haMais = !pagina.ultima;
          this.proximaPagina = pagina.pagina + 1;
          this.isLoading = false;
          this.carregandoMais = false;
        },
        error: erro => {
          this.mensagemErro = mensagemDeErro(erro, 'Erro ao carregar postagens.');
          this.isLoading = false;
          this.carregandoMais = false;
        }
      });
  }
}
