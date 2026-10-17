import { Component, input } from '@angular/core';
import { Postit, papelDaCor } from '../../models/Postit';
import { TextoComEmojisComponent } from '../texto-com-emojis/texto-com-emojis.component';

/** Quanto cada post-it fica torto (em graus), em ordem: cada um para um lado, como colados à mão. */
const INCLINACOES = [-2.2, 1.8, -1.2];

/**
 * Os post-its de um rascunho, na página de leitura: papéis coloridos com borda grossa e sombra dura, uma fita no topo e
 * um pouco tortos, como os do resto do site. Recado vira texto (aceita os emojis da Rasura); foto vira uma "polaroid" com
 * legenda. Tudo sai como texto e imagem comuns, nunca como HTML.
 *
 *     <app-postits-da-leitura [postits]="postagem.postits" />
 */
@Component({
  selector: 'app-postits-da-leitura',
  standalone: true,
  imports: [TextoComEmojisComponent],
  templateUrl: './postits-da-leitura.component.html',
  styleUrls: ['./postits-da-leitura.component.scss']
})
export class PostitsDaLeituraComponent {
  readonly postits = input<Postit[]>([]);

  readonly papelDaCor = papelDaCor;

  inclinacao(indice: number): string {
    return `${INCLINACOES[indice % INCLINACOES.length]}deg`;
  }
}
