import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedPostagensComponent } from '../../components/feed-postagens/feed-postagens.component';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../shared/icon/icon.component';

/** "Minhas postagens": tudo o que a pessoa publicou (comentários e blogs), com editar e excluir. */
@Component({
  selector: 'app-postagem-list',
  standalone: true,
  imports: [FeedPostagensComponent, RouterLink, IconComponent],
  templateUrl: './postagem-list.component.html',
  styleUrls: ['./postagem-list.component.scss']
})
export class PostagemListComponent {
  /** A rota exige login; sem sessão (id ausente) a lista nem é montada. */
  readonly usuarioId = inject(AuthService).getUsuario()?.id;
}
