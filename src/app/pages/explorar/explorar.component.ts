import { Component } from '@angular/core';
import { FeedPostagensComponent } from '../../components/feed-postagens/feed-postagens.component';

/** Feed com as postagens de todo mundo, das mais recentes para as mais antigas. */
@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [FeedPostagensComponent],
  template: '<app-feed-postagens />'
})
export class ExplorarComponent {}
