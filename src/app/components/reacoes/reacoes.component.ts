import { Component, OnInit, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Reacoes, TipoReacao } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/**
 * Totais depois de a pessoa pedir `novo`: tira o efeito da reação anterior e soma o da nova.
 * Usado para o botão responder na hora, antes de a API confirmar.
 */
export function aplicarReacao(atual: Reacoes, novo: TipoReacao | null): Reacoes {
  const anterior = atual.minhaReacao ?? null;
  return {
    curtidas: atual.curtidas - (anterior === 'CURTIDA' ? 1 : 0) + (novo === 'CURTIDA' ? 1 : 0),
    descurtidas: atual.descurtidas - (anterior === 'DESCURTIDA' ? 1 : 0) + (novo === 'DESCURTIDA' ? 1 : 0),
    minhaReacao: novo
  };
}

/**
 * Botões de curtir e descurtir com os totais. Uma reação por pessoa: tocar no botão ligado retira a reação;
 * tocar no outro troca. Visitante vê os números e, ao tocar, é levado ao login.
 */
@Component({
  selector: 'app-reacoes',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './reacoes.component.html',
  styleUrls: ['./reacoes.component.scss']
})
export class ReacoesComponent implements OnInit {
  private readonly postagemService = inject(PostagemService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly postagemId = input.required<number>();
  readonly curtidas = input(0);
  readonly descurtidas = input(0);
  readonly minhaReacao = input<TipoReacao | null | undefined>(null);

  estado: Reacoes = { curtidas: 0, descurtidas: 0, minhaReacao: null };
  enviando = false;
  erro: string | null = null;

  ngOnInit(): void {
    this.estado = { curtidas: this.curtidas(), descurtidas: this.descurtidas(), minhaReacao: this.minhaReacao() ?? null };
  }

  get curtiu(): boolean {
    return this.estado.minhaReacao === 'CURTIDA';
  }

  get descurtiu(): boolean {
    return this.estado.minhaReacao === 'DESCURTIDA';
  }

  /** Texto lido por leitores de tela: o total e o que o toque faz. */
  get rotuloCurtir(): string {
    const total = `${this.estado.curtidas} ${this.estado.curtidas === 1 ? 'curtida' : 'curtidas'}`;
    return `${total}. ${this.curtiu ? 'Retirar curtida' : 'Curtir'}`;
  }

  get rotuloDescurtir(): string {
    const total = `${this.estado.descurtidas} ${this.estado.descurtidas === 1 ? 'descurtida' : 'descurtidas'}`;
    return `${total}. ${this.descurtiu ? 'Retirar descurtida' : 'Descurtir'}`;
  }

  alternar(tipo: TipoReacao): void {
    if (this.enviando) {
      return;
    }
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const anterior = this.estado;
    const novo = anterior.minhaReacao === tipo ? null : tipo; // tocar de novo no botão ligado retira
    this.estado = aplicarReacao(anterior, novo);
    this.enviando = true;
    this.erro = null;

    this.postagemService.reagir(this.postagemId(), novo).subscribe({
      next: totais => {
        // os números da API valem mais que a conta local (outras pessoas podem ter reagido nesse meio tempo)
        this.estado = { curtidas: totais.curtidas, descurtidas: totais.descurtidas, minhaReacao: totais.minhaReacao ?? null };
        this.enviando = false;
      },
      error: erro => {
        this.estado = anterior;
        this.erro = mensagemDeErro(erro, 'Não foi possível registrar sua reação.');
        this.enviando = false;
      }
    });
  }
}
