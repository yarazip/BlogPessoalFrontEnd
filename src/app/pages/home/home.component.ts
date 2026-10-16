import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Postagem } from '../../models/Postagem';
import { PostagemService } from '../../services/postagem.service';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';
import { TextoComEmojisComponent } from '../../components/texto-com-emojis/texto-com-emojis.component';
import { LogoComponent } from '../../shared/logo/logo.component';

/** Quantas postagens reais aparecem na vitrine da página inicial. */
const POSTAGENS_NA_VITRINE = 3;

/**
 * Página inicial para quem ainda não entrou: o que é a Rasura, os dois tipos de postagem (rascunho e
 * rabisco) e uma vitrine com as últimas postagens de verdade. Os exemplos de rascunho e rabisco são
 * ilustrações fixas e estão marcados como tal; nada aqui é número ou depoimento inventado.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, LogoComponent, DateBrPipe, TextoComEmojisComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);

  /** Faixa de frases que corre abaixo da abertura. */
  readonly frases = [
    'Bem-vinda à Rasura',
    'escreva um rascunho hoje',
    'solte um rabisco agora',
    'sem pressa, sem pose'
  ];

  /** Últimas postagens públicas; vazia (e a vitrine some) se a API falhar ou ainda não houver nada. */
  postagens: Postagem[] = [];

  ngOnInit(): void {
    this.postagemService.getPagina({ page: 0, size: POSTAGENS_NA_VITRINE }).subscribe({
      next: pagina => (this.postagens = pagina.conteudo),
      error: () => (this.postagens = [])
    });
  }

  /** Inicial do nome, para quem não tem foto. */
  inicialDe(postagem: Postagem): string {
    return (postagem.usuario?.nome ?? '?').trim().charAt(0).toUpperCase();
  }

  ehRabisco(postagem: Postagem): boolean {
    return postagem.tipo === 'COMENTARIO';
  }
}
