import { Component, DestroyRef, Injector, effect, inject, input, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ItemDeBusca } from '../../models/ItemDeBusca';
import { LIMITE_DESTAQUE, Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
import { BuscaLivroService } from '../../services/busca-livro.service';
import { BuscaMusicaService } from '../../services/busca-musica.service';
import { BuscaDestaqueComponent } from '../busca-destaque/busca-destaque.component';
import { PerfilService } from '../../services/perfil.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/**
 * Moldura de blog para as páginas de leitura: o conteúdo (feed) no meio e, no computador, uma barra lateral
 * com caixinhas ao estilo dos blogs dos anos 2000. No celular e no tablet a barra some e o feed ocupa a tela.
 *
 * A barra mostra o cartão da pessoa (foto, nome e bio), a música e o livro do momento (que só a dona edita)
 * e as caixas "sobre" e "cantinho". Sem `perfilId`, usa a pessoa logada; visitante só vê "sobre" e "cantinho".
 * `comCartao=false` esconde o cartão (o perfil já mostra foto e bio no topo), mantendo música e livro.
 */
@Component({
  selector: 'app-layout-blog',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, BuscaDestaqueComponent],
  templateUrl: './layout-blog.component.html',
  styleUrls: ['./layout-blog.component.scss']
})
export class LayoutBlogComponent {
  private readonly perfilService = inject(PerfilService);
  private readonly authService = inject(AuthService);
  // as buscas só são criadas quando a pessoa realmente busca (a barra aparece em várias telas e testes)
  private readonly injector = inject(Injector);

  readonly perfilId = input<number | null>(null);
  readonly comCartao = input(true);

  readonly logado = this.authService.isLoggedIn();
  readonly fotoPadrao = 'assets/img/sem-foto.svg';
  readonly limiteDestaque = LIMITE_DESTAQUE;

  readonly musica = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_DESTAQUE)] });
  readonly livro = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_DESTAQUE)] });
  // o <form> precisa de um FormGroup: é ele que impede o envio nativo (recarregar a página)
  readonly destaquesForm = new FormGroup({ musica: this.musica, livro: this.livro });

  /** Funções de busca passadas aos campos (iTunes para música, Open Library para livro). */
  readonly buscarMusica = (termo: string) => this.injector.get(BuscaMusicaService).buscar(termo);
  readonly buscarLivro = (termo: string) => this.injector.get(BuscaLivroService).buscar(termo);

  perfil: Perfil | null = null;
  /** O item escolhido na busca (com capa e prévia); nulo quando o texto foi digitado à mão. */
  musicaItem: ItemDeBusca | null = null;
  livroItem: ItemDeBusca | null = null;
  /** A prévia de 30 segundos está tocando. */
  tocando = false;
  private audio: HTMLAudioElement | null = null;
  editando = false;
  salvando = false;
  erro: string | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.pararPrevia());
    effect(() => {
      const id = this.perfilId() ?? (this.logado ? (this.authService.getUsuario()?.id ?? null) : null);
      untracked(() => this.carregar(id));
    });
  }

  /** É a barra da própria pessoa logada: só ela edita a música e o livro. */
  get ehDona(): boolean {
    return this.perfil !== null && this.logado && this.authService.getUsuario()?.id === this.perfil.id;
  }

  get temDestaques(): boolean {
    return !!(this.perfil?.musicaAtual || this.perfil?.livroAtual);
  }

  /** A caixa existe se há algo a mostrar, ou se a dona pode preencher. */
  get mostrarDestaques(): boolean {
    return this.perfil !== null && (this.temDestaques || this.ehDona);
  }

  private carregar(id: number | null): void {
    this.perfil = null;
    this.editando = false;
    if (id === null) {
      return;
    }
    // a barra é um enfeite: se o perfil não carregar, ela só não mostra o cartão
    this.perfilService.getPerfil(id).subscribe({
      next: perfil => (this.perfil = perfil),
      error: () => (this.perfil = null)
    });
  }

  editar(): void {
    this.pararPrevia();
    this.musica.setValue(this.perfil?.musicaAtual ?? '');
    this.livro.setValue(this.perfil?.livroAtual ?? '');
    // mantém a capa e a prévia atuais enquanto a pessoa não mexer no texto
    this.musicaItem = this.perfil?.musicaCapa || this.perfil?.musicaPrevia
      ? { titulo: '', detalhe: '', capa: this.perfil.musicaCapa ?? null, previa: this.perfil.musicaPrevia ?? null }
      : null;
    this.livroItem = this.perfil?.livroCapa
      ? { titulo: '', detalhe: '', capa: this.perfil.livroCapa, previa: null }
      : null;
    this.erro = null;
    this.editando = true;
  }

  cancelar(): void {
    this.editando = false;
    this.erro = null;
  }

  salvar(): void {
    if (!this.perfil || this.destaquesForm.invalid || this.salvando) {
      return;
    }

    this.salvando = true;
    this.erro = null;

    this.perfilService
      .atualizarDestaques(this.perfil.id, {
        musicaAtual: this.musica.value,
        livroAtual: this.livro.value,
        musicaCapa: this.musicaItem?.capa ?? '',
        musicaPrevia: this.musicaItem?.previa ?? '',
        livroCapa: this.livroItem?.capa ?? ''
      })
      .subscribe({
        next: perfil => {
          this.perfil = {
            ...this.perfil!,
            musicaAtual: perfil.musicaAtual ?? null,
            livroAtual: perfil.livroAtual ?? null,
            musicaCapa: perfil.musicaCapa ?? null,
            musicaPrevia: perfil.musicaPrevia ?? null,
            livroCapa: perfil.livroCapa ?? null
          };
          this.editando = false;
          this.salvando = false;
        },
        error: erro => {
          this.erro = mensagemDeErro(erro, 'Não foi possível salvar. Tente novamente.');
          this.salvando = false;
        }
      });
  }

  /** Toca ou pausa a prévia de 30 segundos. O navegador exige um clique para tocar, então nunca começa sozinha. */
  alternarPrevia(): void {
    const url = this.perfil?.musicaPrevia;
    if (!url) {
      return;
    }
    if (this.tocando) {
      this.pararPrevia();
      return;
    }
    this.audio = new Audio(url);
    this.audio.addEventListener('ended', () => (this.tocando = false));
    this.audio.addEventListener('error', () => (this.tocando = false));
    this.tocando = true;
    this.audio.play().catch(() => (this.tocando = false));
  }

  private pararPrevia(): void {
    this.audio?.pause();
    this.audio = null;
    this.tocando = false;
  }
}
