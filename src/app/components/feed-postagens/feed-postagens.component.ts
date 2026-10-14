import { Component, OnInit, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';
import { SentinelaDirective } from '../../shared/sentinela/sentinela.directive';
import { MenuPostagemComponent } from '../menu-postagem/menu-postagem.component';
import { ReacoesComponent } from '../reacoes/reacoes.component';
import { AuthService } from '../../services/auth.service';
import { FonteService } from '../../services/fonte.service';
import { PostagemService } from '../../services/postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { minutosDeLeitura } from '../../shared/leitura';
import { pesoDoTituloDe, pilhaDe } from '../../models/Fonte';
import { Postagem } from '../../models/Postagem';

const POSTAGENS_POR_PAGINA = 10;

@Component({
  selector: 'app-feed-postagens',
  standalone: true,
  imports: [DateBrPipe, SentinelaDirective, RouterLink, ReacoesComponent, MenuPostagemComponent],
  templateUrl: './feed-postagens.component.html',
  styleUrls: ['./feed-postagens.component.scss']
})
/**
 * Lista de postagens em coluna única, com rolagem infinita. Sem `autor` mostra o feed de todo mundo;
 * com `autor` mostra só as postagens daquela pessoa. O conteúdo colocado dentro da tag (por exemplo o
 * cabeçalho de um perfil) aparece no topo da coluna.
 */
export class FeedPostagensComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);
  private readonly authService = inject(AuthService);
  private readonly fontes = inject(FonteService);

  /** Para o template: a fonte escolhida pela autora (nulo = a padrão do site, sem estilo). */
  readonly pilhaDe = pilhaDe;
  readonly pesoDoTituloDe = pesoDoTituloDe;

  readonly autor = input<number>();
  readonly mensagemVazia = input('Ainda não há postagens.');
  /** Avisa a página que uma postagem foi excluída daqui (ex.: o perfil atualiza a contagem). */
  readonly removida = output<Postagem>();

  postagens: Postagem[] = [];
  isLoading = true;
  carregandoMais = false;
  haMais = false;
  mensagemErro: string | null = null;
  erroAcao: string | null = null;

  private proximaPagina = 0;

  readonly fotoPadrao = 'assets/img/sem-foto.svg';

  ngOnInit(): void {
    this.carregar();
  }

  /** Busca a próxima página e a acrescenta ao feed (chamado ao rolar até o fim da lista). */
  carregarMais(): void {
    if (!this.carregandoMais && this.haMais && !this.mensagemErro) {
      this.carregar();
    }
  }

  /** Coloca uma postagem recém-criada no topo, sem recarregar a lista. */
  adicionarNoTopo(postagem: Postagem): void {
    this.fontes.carregar(postagem.fonte);
    this.postagens = [postagem, ...this.postagens];
  }

  /** Trecho da postagem para o nome do menu lido por leitores de tela. */
  rotuloDe(postagem: Postagem): string {
    return (postagem.titulo || postagem.texto).slice(0, 50);
  }

  /** Minutos de leitura de um rascunho; rabisco não mostra, e prévia sem o dado da API também não. */
  minutosDe(postagem: Postagem): number | null {
    if (postagem.tipo === 'COMENTARIO') {
      return null;
    }
    if (postagem.minutosLeitura) {
      return postagem.minutosLeitura;
    }
    return postagem.resumido ? null : minutosDeLeitura(postagem.texto);
  }

  /** O menu de três pontinhos (Editar e Excluir) aparece nas postagens da própria pessoa; a API também exige. */
  ehMinha(postagem: Postagem): boolean {
    const eu = this.authService.getUsuario();
    return !!eu && !!postagem.usuario && eu.id === postagem.usuario.id;
  }

  excluir(postagem: Postagem): void {
    if (postagem.id === undefined || !confirm('Deseja excluir esta postagem?')) {
      return;
    }

    this.erroAcao = null;
    this.postagemService.delete(postagem.id).subscribe({
      next: () => {
        this.postagens = this.postagens.filter(p => p.id !== postagem.id);
        this.removida.emit(postagem);
      },
      error: erro => {
        this.erroAcao = mensagemDeErro(erro, 'Não foi possível excluir a postagem.');
      }
    });
  }

  /** Repete a última busca que falhou, sem perder o que já está na tela. */
  tentarDeNovo(): void {
    this.carregar();
  }

  /** Alguns temas antigos foram gravados com aspas no banco (ex.: 'Tecnologia'); aqui elas não aparecem. */
  nomeDoTema(descricao = ''): string {
    return descricao.replace(/^['"]+|['"]+$/g, '');
  }

  private carregar(): void {
    const primeira = this.proximaPagina === 0;
    this.mensagemErro = null;
    this.carregandoMais = !primeira;

    const autor = this.autor();
    const opcoes = { page: this.proximaPagina, size: POSTAGENS_POR_PAGINA, ...(autor !== undefined && { autor }) };

    this.postagemService.getPagina(opcoes).subscribe({
      next: pagina => {
        pagina.conteudo.forEach(p => this.fontes.carregar(p.fonte));
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
