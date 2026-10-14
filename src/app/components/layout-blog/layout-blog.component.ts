import { Component, effect, inject, input, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LIMITE_DESTAQUE, Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
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
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './layout-blog.component.html',
  styleUrls: ['./layout-blog.component.scss']
})
export class LayoutBlogComponent {
  private readonly perfilService = inject(PerfilService);
  private readonly authService = inject(AuthService);

  readonly perfilId = input<number | null>(null);
  readonly comCartao = input(true);

  readonly logado = this.authService.isLoggedIn();
  readonly fotoPadrao = 'assets/img/sem-foto.svg';
  readonly limiteDestaque = LIMITE_DESTAQUE;

  readonly musica = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_DESTAQUE)] });
  readonly livro = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_DESTAQUE)] });
  // o <form> precisa de um FormGroup: é ele que impede o envio nativo (recarregar a página)
  readonly destaquesForm = new FormGroup({ musica: this.musica, livro: this.livro });

  perfil: Perfil | null = null;
  editando = false;
  salvando = false;
  erro: string | null = null;

  constructor() {
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
    this.musica.setValue(this.perfil?.musicaAtual ?? '');
    this.livro.setValue(this.perfil?.livroAtual ?? '');
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
      .atualizarDestaques(this.perfil.id, { musicaAtual: this.musica.value, livroAtual: this.livro.value })
      .subscribe({
        next: perfil => {
          this.perfil = { ...this.perfil!, musicaAtual: perfil.musicaAtual ?? null, livroAtual: perfil.livroAtual ?? null };
          this.editando = false;
          this.salvando = false;
        },
        error: erro => {
          this.erro = mensagemDeErro(erro, 'Não foi possível salvar. Tente novamente.');
          this.salvando = false;
        }
      });
  }
}
