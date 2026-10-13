import { Component, inject } from '@angular/core';
import { CompositorComentarioComponent } from '../../components/compositor-comentario/compositor-comentario.component';
import { FeedPostagensComponent } from '../../components/feed-postagens/feed-postagens.component';
import { AuthService } from '../../services/auth.service';

/**
 * Feed com as postagens de todo mundo, das mais recentes para as mais antigas. Quem está logado
 * ganha, no topo, a caixa para publicar um comentário.
 */
@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [FeedPostagensComponent, CompositorComentarioComponent],
  template: `
    <app-feed-postagens #feed>
      @if (logado) {
        <app-compositor-comentario (publicado)="feed.adicionarNoTopo($event)" />
      }
    </app-feed-postagens>
  `
})
export class ExplorarComponent {
  readonly logado = inject(AuthService).isLoggedIn();
}
