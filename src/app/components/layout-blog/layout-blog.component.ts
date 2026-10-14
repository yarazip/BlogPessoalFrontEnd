import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tema } from '../../models/Tema';
import { AuthService } from '../../services/auth.service';
import { TemaService } from '../../services/tema.service';

/**
 * Moldura de blog para as páginas de leitura: o conteúdo (feed) no meio e, no computador, uma barra lateral
 * com caixinhas ao estilo dos blogs dos anos 2000 ("Sobre", "Temas", "Cantinho"). No celular e no tablet
 * a barra some e o feed ocupa a tela, como antes.
 */
@Component({
  selector: 'app-layout-blog',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './layout-blog.component.html',
  styleUrls: ['./layout-blog.component.scss']
})
export class LayoutBlogComponent implements OnInit {
  private readonly temaService = inject(TemaService);

  readonly logado = inject(AuthService).isLoggedIn();

  temas: Tema[] = [];

  ngOnInit(): void {
    // a barra é um enfeite: se a lista de temas falhar, a caixa simplesmente não aparece
    this.temaService.getAll().subscribe({
      next: temas => (this.temas = temas),
      error: () => (this.temas = [])
    });
  }

  /** Alguns temas antigos foram gravados com aspas no banco; aqui elas não aparecem. */
  nomeDoTema(descricao = ''): string {
    return descricao.replace(/^['"]+|['"]+$/g, '');
  }
}
