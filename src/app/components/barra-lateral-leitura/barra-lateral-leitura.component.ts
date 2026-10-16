import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Perfil } from '../../models/Perfil';
import { Postagem } from '../../models/Postagem';
import { Usuario } from '../../models/Usuario';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';
import { maisDaAutora, temasDaAutora } from '../../shared/leitura-lateral';
import { minutosDeLeitura } from '../../shared/leitura';
import { NoMomentoComponent } from '../no-momento/no-momento.component';

/**
 * A barra lateral da página de leitura (estilo blog dos anos 2000): cartão da autora, o que ela está ouvindo e lendo,
 * os últimos textos e os temas que ela usa. Cada caixa só aparece quando há o que mostrar, e falhar ao carregar o
 * perfil ou a lista não derruba nada: sobra o cartão com o nome e a foto da própria postagem.
 *
 *     <app-barra-lateral-leitura [autor]="postagem.usuario" [perfil]="perfil" [postagensDaAutora]="lista" [atualId]="postagem.id" />
 */
@Component({
  selector: 'app-barra-lateral-leitura',
  standalone: true,
  imports: [RouterLink, DateBrPipe, NoMomentoComponent],
  templateUrl: './barra-lateral-leitura.component.html',
  styleUrls: ['./barra-lateral-leitura.component.scss']
})
export class BarraLateralLeituraComponent {
  /** Nome e foto como vêm na postagem (valem mesmo se o perfil não carregar). */
  readonly autor = input.required<Usuario>();
  readonly perfil = input<Perfil | null>(null);
  /** As postagens recentes da autora (das mais novas para as mais antigas). */
  readonly postagensDaAutora = input<Postagem[]>([]);
  /** A postagem que está sendo lida, para não aparecer em "mais da autora". */
  readonly atualId = input<number | undefined>(undefined);

  readonly fotoPadrao = 'assets/img/sem-foto.svg';

  readonly maisDaAutora = computed(() => maisDaAutora(this.postagensDaAutora(), this.atualId() ?? -1));
  readonly temas = computed(() => temasDaAutora(this.postagensDaAutora()));

  /** O perfil tem música ou livro do momento para mostrar. */
  readonly temDestaques = computed(() => {
    const p = this.perfil();
    return !!p && (!!p.musicaAtual || !!p.livroAtual);
  });

  /** Total de postagens da autora: o do perfil, ou, se ele não carregou, o que veio na lista. */
  readonly totalDePostagens = computed(() => this.perfil()?.totalPostagens ?? null);

  minutosDe(postagem: Postagem): number {
    return postagem.minutosLeitura ?? minutosDeLeitura(postagem.texto);
  }
}
