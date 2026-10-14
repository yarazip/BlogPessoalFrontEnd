import { Component, inject } from '@angular/core';
import { FaixaNoMomentoComponent } from '../../components/faixa-no-momento/faixa-no-momento.component';
import { CompositorComentarioComponent } from '../../components/compositor-comentario/compositor-comentario.component';
import { FeedPostagensComponent } from '../../components/feed-postagens/feed-postagens.component';
import { LayoutBlogComponent } from '../../components/layout-blog/layout-blog.component';
import { AuthService } from '../../services/auth.service';

/**
 * Feed com as postagens de todo mundo, das mais recentes para as mais antigas, dentro da moldura de blog.
 * Quem está logado ganha, no topo, a caixa para publicar um rabisco e, no celular, uma faixa fina com a música
 * e o livro do momento.
 */
@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [FeedPostagensComponent, CompositorComentarioComponent, FaixaNoMomentoComponent, LayoutBlogComponent],
  template: `
    <app-layout-blog>
      <app-feed-postagens #feed>
        @if (logado) {
          <app-compositor-comentario (publicado)="feed.adicionarNoTopo($event)" />
          <app-faixa-no-momento />
        }
      </app-feed-postagens>
    </app-layout-blog>
  `
})
export class ExplorarComponent {
  readonly logado = inject(AuthService).isLoggedIn();
}
