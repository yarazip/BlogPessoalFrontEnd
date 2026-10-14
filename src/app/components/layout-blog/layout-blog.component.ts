import { Component, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Perfil } from '../../models/Perfil';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { NoMomentoComponent } from '../no-momento/no-momento.component';

/**
 * Moldura de blog para as páginas de leitura: o conteúdo (feed) no meio e, no computador, uma barra lateral
 * com caixinhas ao estilo dos blogs dos anos 2000. No celular e no tablet a barra some e o feed ocupa a tela
 * (no perfil, a música e o livro do momento passam para dentro do topo do perfil).
 *
 * A barra mostra o cartão da pessoa (foto, nome e bio), a música e o livro do momento (que só a dona edita)
 * e as caixas "sobre" e "cantinho". Sem `perfilId`, usa a pessoa logada; visitante só vê "sobre" e "cantinho".
 * `comCartao=false` esconde o cartão (o perfil já mostra foto e bio no topo), mantendo música e livro.
 */
@Component({
  selector: 'app-layout-blog',
  standalone: true,
  imports: [RouterLink, NoMomentoComponent],
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

  perfil: Perfil | null = null;

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
    if (id === null) {
      return;
    }
    // a barra é um enfeite: se o perfil não carregar, ela só não mostra o cartão
    this.perfilService.getPerfil(id).subscribe({
      next: perfil => (this.perfil = perfil),
      error: () => (this.perfil = null)
    });
  }
}
