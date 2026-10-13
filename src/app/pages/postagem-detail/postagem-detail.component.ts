import { IconComponent } from '../../shared/icon/icon.component';
import { ReacoesComponent } from '../../components/reacoes/reacoes.component';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';
import { AuthService } from '../../services/auth.service';
import { FonteService } from '../../services/fonte.service';
import { PostagemService } from '../../services/postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { pesoDoTituloDe, pilhaDe } from '../../models/Fonte';
import { Postagem } from '../../models/Postagem';

@Component({
  selector: 'app-postagem-detail',
  standalone: true,
  imports: [DateBrPipe, IconComponent, RouterLink, ReacoesComponent],
  templateUrl: './postagem-detail.component.html',
  styleUrls: ['./postagem-detail.component.scss']
})
export class PostagemDetailComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);
  private readonly authService = inject(AuthService);
  private readonly fontes = inject(FonteService);

  /** Para o template: a fonte escolhida pela autora (nulo = a padrão do site, sem estilo). */
  readonly pilhaDe = pilhaDe;
  readonly pesoDoTituloDe = pesoDoTituloDe;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly fotoPadrao = 'assets/img/sem-foto.svg';

  postagem?: Postagem;
  isLoading = true;
  mensagemErro: string | null = null;

  /** Só o autor vê as ações de editar e excluir (a API também exige isso). */
  get ehAutor(): boolean {
    const usuario = this.authService.getUsuario();
    return !!usuario && !!this.postagem?.usuario && usuario.id === this.postagem.usuario.id;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.router.navigate(['/explorar']);
      return;
    }

    this.postagemService.getById(id).subscribe({
      next: postagem => {
        this.fontes.carregar(postagem.fonte);
        this.postagem = postagem;
        this.isLoading = false;
      },
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Postagem não encontrada.');
        this.isLoading = false;
      }
    });
  }

  /** Alguns temas antigos foram gravados com aspas no banco (ex.: 'Tecnologia'); aqui elas não aparecem. */
  nomeDoTema(descricao = ''): string {
    return descricao.replace(/^['"]+|['"]+$/g, '');
  }

  editar(id: number): void {
    this.router.navigate(['/postagens', id, 'editar']);
  }

  excluir(id: number): void {
    if (!confirm('Deseja excluir esta postagem?')) {
      return;
    }

    this.isLoading = true;
    this.mensagemErro = null;
    this.postagemService.delete(id).subscribe({
      next: () => this.router.navigate(['/postagens']),
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Erro ao excluir postagem.');
        this.isLoading = false;
      }
    });
  }
}
