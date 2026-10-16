import { Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ComentarioPostagem, LIMITE_COMENTARIO_POSTAGEM } from '../../models/ComentarioPostagem';
import { AuthService } from '../../services/auth.service';
import { ComentarioPostagemService } from '../../services/comentario-postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';
import { IconComponent } from '../../shared/icon/icon.component';
import { TextoComEmojisComponent } from '../texto-com-emojis/texto-com-emojis.component';
import { ConfirmarExclusaoComponent } from '../confirmar-exclusao/confirmar-exclusao.component';

/**
 * Comentários de uma postagem: a lista (do mais antigo ao mais novo, com "ver mais"), o formulário para quem está
 * logado e, para visitante, o convite para entrar. Quem pode apagar vem da API (`podeExcluir`); apagar pergunta antes.
 *
 *     <app-comentarios-da-postagem [postagemId]="postagem.id" />
 */
@Component({
  selector: 'app-comentarios-da-postagem',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DateBrPipe, IconComponent, ConfirmarExclusaoComponent, TextoComEmojisComponent],
  templateUrl: './comentarios-da-postagem.component.html',
  styleUrls: ['./comentarios-da-postagem.component.scss']
})
export class ComentariosDaPostagemComponent implements OnInit {
  private readonly servico = inject(ComentarioPostagemService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly postagemId = input.required<number>();
  /** Avisa o novo total quando alguém comenta ou apaga, para quem mostra a contagem em outro lugar. */
  readonly totalMudou = output<number>();

  readonly limite = LIMITE_COMENTARIO_POSTAGEM;
  readonly fotoPadrao = 'assets/img/sem-foto.svg';
  readonly texto = this.fb.nonNullable.control('');

  comentarios: ComentarioPostagem[] = [];
  total = 0;
  carregando = true;
  carregandoMais = false;
  erroLista: string | null = null;
  enviando = false;
  erroEnvio: string | null = null;
  erroAcao: string | null = null;

  private proximaPagina = 0;
  private ultima = true;

  /** O comentário que está no modal de confirmação (nulo = fechado). */
  paraExcluir: ComentarioPostagem | null = null;
  excluindo = false;

  get logado(): boolean {
    return this.authService.isLoggedIn();
  }

  get fotoDeQuemEscreve(): string {
    return this.authService.getUsuario()?.foto || this.fotoPadrao;
  }

  get haMais(): boolean {
    return !this.ultima;
  }

  get restantes(): number {
    return this.limite - this.texto.value.length;
  }

  get podeEnviar(): boolean {
    return !this.enviando && this.texto.value.trim().length > 0 && this.restantes >= 0;
  }

  ngOnInit(): void {
    this.carregar();
  }

  /** Primeira página, ou a próxima quando já há comentários na tela. Com `ateOFim`, segue até a última. */
  carregar(ateOFim = false): void {
    const primeira = this.proximaPagina === 0;
    this.erroLista = null;
    if (primeira) {
      this.carregando = true;
    } else {
      this.carregandoMais = true;
    }

    this.servico.listar(this.postagemId(), this.proximaPagina).subscribe({
      next: pagina => {
        this.comentarios = [...this.comentarios, ...pagina.conteudo];
        this.total = pagina.totalElementos;
        this.ultima = pagina.ultima;
        this.proximaPagina = pagina.pagina + 1;
        this.carregando = false;
        this.carregandoMais = false;
        if (ateOFim && !pagina.ultima) {
          this.carregar(true);
        }
      },
      error: erro => {
        this.erroLista = mensagemDeErro(erro, 'Não foi possível carregar os recados.');
        this.carregando = false;
        this.carregandoMais = false;
      }
    });
  }

  enviar(): void {
    if (!this.podeEnviar) {
      return;
    }
    this.enviando = true;
    this.erroEnvio = null;

    this.servico.comentar(this.postagemId(), this.texto.value.trim()).subscribe({
      next: novo => {
        this.enviando = false;
        this.texto.reset('');
        this.total += 1;
        this.totalMudou.emit(this.total);
        if (this.ultima) {
          this.comentarios = [...this.comentarios, novo];
        } else {
          // há páginas por carregar: o novo é o último da lista, então traz o resto em vez de colocá-lo fora de ordem
          this.carregar(true);
        }
      },
      error: erro => {
        this.enviando = false;
        this.erroEnvio = mensagemDeErro(erro, 'Não foi possível enviar o recado. Tente novamente.');
      }
    });
  }

  pedirExclusao(comentario: ComentarioPostagem): void {
    this.erroAcao = null;
    this.paraExcluir = comentario;
  }

  cancelarExclusao(): void {
    if (!this.excluindo) {
      this.paraExcluir = null;
    }
  }

  confirmarExclusao(): void {
    const alvo = this.paraExcluir;
    if (!alvo || this.excluindo) {
      return;
    }
    this.excluindo = true;

    this.servico.excluir(this.postagemId(), alvo.id).subscribe({
      next: () => {
        this.excluindo = false;
        this.paraExcluir = null;
        this.comentarios = this.comentarios.filter(c => c.id !== alvo.id);
        this.total = Math.max(0, this.total - 1);
        this.totalMudou.emit(this.total);
      },
      error: erro => {
        this.excluindo = false;
        this.paraExcluir = null;
        this.erroAcao = mensagemDeErro(erro, 'Não foi possível apagar o recado.');
      }
    });
  }
}
