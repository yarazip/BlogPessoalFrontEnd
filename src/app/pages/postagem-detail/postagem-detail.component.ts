import { IconComponent } from '../../shared/icon/icon.component';
import { ConfirmarExclusaoComponent } from '../../components/confirmar-exclusao/confirmar-exclusao.component';
import { ComentariosDaPostagemComponent } from '../../components/comentarios-da-postagem/comentarios-da-postagem.component';
import { ReacoesComponent } from '../../components/reacoes/reacoes.component';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';
import { AuthService } from '../../services/auth.service';
import { FonteService } from '../../services/fonte.service';
import { PostagemService } from '../../services/postagem.service';
import { minutosDeLeitura } from '../../shared/leitura';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { pesoDoTituloDe, pilhaDe } from '../../models/Fonte';
import { Postagem } from '../../models/Postagem';

@Component({
  selector: 'app-postagem-detail',
  standalone: true,
  imports: [DateBrPipe, IconComponent, RouterLink, ReacoesComponent, ComentariosDaPostagemComponent, ConfirmarExclusaoComponent],
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

  /** Minutos de leitura do rascunho (o rabisco, curto, não mostra). Aqui o texto vem inteiro, então dá para calcular. */
  get minutos(): number | null {
    const p = this.postagem;
    return p && p.tipo !== 'COMENTARIO' ? (p.minutosLeitura ?? minutosDeLeitura(p.texto)) : null;
  }

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

  /** O id da postagem que está no modal de confirmação (nulo = modal fechado). */
  idParaExcluir: number | null = null;
  excluindo = false;

  /** "Excluir": só abre a pergunta; nada é apagado até a pessoa confirmar no modal. */
  excluir(id: number): void {
    this.mensagemErro = null;
    this.idParaExcluir = id;
  }

  cancelarExclusao(): void {
    if (!this.excluindo) {
      this.idParaExcluir = null;
    }
  }

  confirmarExclusao(): void {
    const id = this.idParaExcluir;
    if (id === null || this.excluindo) {
      return;
    }

    this.excluindo = true;
    this.postagemService.delete(id).subscribe({
      next: () => {
        this.excluindo = false;
        this.idParaExcluir = null;
        this.router.navigate(['/postagens']);
      },
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Erro ao excluir postagem.');
        this.excluindo = false;
        this.idParaExcluir = null;
      }
    });
  }
}
