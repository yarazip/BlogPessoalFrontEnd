import { IconComponent } from '../../shared/icon/icon.component';
import { ConfirmarExclusaoComponent } from '../../components/confirmar-exclusao/confirmar-exclusao.component';
import { ComentariosDaPostagemComponent } from '../../components/comentarios-da-postagem/comentarios-da-postagem.component';
import { TextoComEmojisComponent } from '../../components/texto-com-emojis/texto-com-emojis.component';
import { BarraLateralLeituraComponent } from '../../components/barra-lateral-leitura/barra-lateral-leitura.component';
import { ReacoesComponent } from '../../components/reacoes/reacoes.component';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';
import { AuthService } from '../../services/auth.service';
import { FonteService } from '../../services/fonte.service';
import { PerfilService } from '../../services/perfil.service';
import { PostagemService } from '../../services/postagem.service';
import { minutosDeLeitura } from '../../shared/leitura';
import { POSTAGENS_DA_AUTORA, ehRascunho, rotuloDe, vizinhasDe } from '../../shared/leitura-lateral';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { pesoDoTituloDe, pilhaDe } from '../../models/Fonte';
import { ArquivoMes } from '../../models/ArquivoMes';
import { Perfil } from '../../models/Perfil';
import { Postagem } from '../../models/Postagem';

/** Meses abreviados da etiqueta de calendário do cabeçalho do post. */
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

@Component({
  selector: 'app-postagem-detail',
  standalone: true,
  imports: [
    IconComponent,
    RouterLink,
    ReacoesComponent,
    ComentariosDaPostagemComponent,
    ConfirmarExclusaoComponent,
    TextoComEmojisComponent,
    BarraLateralLeituraComponent
  ],
  templateUrl: './postagem-detail.component.html',
  styleUrls: ['./postagem-detail.component.scss']
})
export class PostagemDetailComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);
  private readonly authService = inject(AuthService);
  private readonly fontes = inject(FonteService);
  private readonly perfilService = inject(PerfilService);
  private readonly dateBr = new DateBrPipe();

  /** Para o template: a fonte escolhida pela autora (nulo = a padrão do site, sem estilo). */
  readonly pilhaDe = pilhaDe;
  readonly pesoDoTituloDe = pesoDoTituloDe;
  readonly rotuloDe = rotuloDe;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly fotoPadrao = 'assets/img/sem-foto.svg';

  postagem?: Postagem;
  isLoading = true;
  mensagemErro: string | null = null;

  /** Barra lateral e navegação: vêm do perfil e das postagens recentes da autora (se falharem, a leitura segue sem eles). */
  perfil: Perfil | null = null;
  arquivo: ArquivoMes[] = [];
  postagensDaAutora: Postagem[] = [];
  anterior?: Postagem;
  proxima?: Postagem;

  /** Quantos recados (comentários) a postagem tem; o livro de visitas avisa quando muda. */
  totalRecados = 0;
  linkCopiado = false;

  /** O contador de visitas (nulo até a API responder; se falhar, a caixa não aparece). */
  visitas: number | null = null;

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
        this.totalRecados = postagem.comentarios ?? 0;
        this.isLoading = false;
        this.carregarLateral(postagem);
        this.contarVisita(postagem);
      },
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Postagem não encontrada.');
        this.isLoading = false;
      }
    });
  }

  /** "3 recados no livro de visitas" (ou "nenhum recado ainda"). */
  get textoDosRecados(): string {
    if (this.totalRecados === 0) {
      return 'nenhum recado no livro de visitas';
    }
    return `${this.totalRecados} ${this.totalRecados === 1 ? 'recado' : 'recados'} no livro de visitas`;
  }

  diaDe(data: Postagem['data']): string {
    return this.dateBr.transform(data, 'dd');
  }

  mesDe(data: Postagem['data']): string {
    return MESES[Number(this.dateBr.transform(data, 'M')) - 1] ?? '';
  }

  anoDe(data: Postagem['data']): string {
    return this.dateBr.transform(data, 'yyyy');
  }

  horaDe(data: Postagem['data']): string {
    return this.dateBr.transform(data, 'HH:mm');
  }

  /** Copia o endereço da postagem (sem o #comentarios) e avisa por alguns segundos. */
  copiarLink(): void {
    const id = this.postagem?.id;
    if (id === undefined || !navigator.clipboard) {
      return;
    }
    navigator.clipboard
      .writeText(`${window.location.origin}/postagens/${id}`)
      .then(() => {
        this.linkCopiado = true;
        setTimeout(() => (this.linkCopiado = false), 2500);
      })
      .catch(() => {
        // sem permissão para copiar: o botão só não faz nada (o endereço continua na barra do navegador)
      });
  }

  /**
   * Conta esta visita (a API conta no máximo uma por pessoa por dia e ignora a própria autora) e mostra o total. Se
   * falhar, a leitura segue sem o contador.
   */
  private contarVisita(postagem: Postagem): void {
    if (postagem.id === undefined) {
      return;
    }
    this.postagemService.registrarVisita(postagem.id).subscribe({
      next: resposta => (this.visitas = resposta.visitas),
      error: () => {
        this.visitas = postagem.visitas ?? null;
      }
    });
  }

  /**
   * Busca o perfil e as postagens recentes da autora de uma vez. Qualquer falha vira "sem isso": a leitura não depende
   * da barra lateral nem dos botões de anterior e próxima.
   */
  private carregarLateral(postagem: Postagem): void {
    const autorId = postagem.usuario?.id;
    if (autorId === undefined || postagem.id === undefined) {
      return;
    }
    forkJoin({
      perfil: this.perfilService.getPerfil(autorId).pipe(catchError(() => of(null))),
      arquivo: this.perfilService.getArquivo(autorId).pipe(catchError(() => of([] as ArquivoMes[]))),
      lista: this.postagemService
        .getPagina({ autor: autorId, size: POSTAGENS_DA_AUTORA })
        .pipe(
          map(pagina => pagina.conteudo),
          catchError(() => of([] as Postagem[]))
        )
    }).subscribe(({ perfil, arquivo, lista }) => {
      this.perfil = perfil;
      this.arquivo = arquivo;
      this.postagensDaAutora = lista;
      const vizinhas = vizinhasDe(lista, postagem.id!, ehRascunho(postagem));
      this.anterior = vizinhas.anterior;
      this.proxima = vizinhas.proxima;
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
