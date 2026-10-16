import { Component, ElementRef, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Notificacao } from '../../models/Notificacao';
import { NotificacaoService } from '../../services/notificacao.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { DateBrPipe } from '../../shared/pipes/date-br.pipe';

/** De quanto em quanto tempo o número do sino é atualizado (só com a aba visível). */
export const INTERVALO_DO_SINO_EM_MS = 60_000;

/**
 * O sino do cabeçalho: mostra quantas notificações ainda não foram lidas e, ao clicar, a lista das mais recentes (quem
 * curtiu ou comentou e em qual postagem). Abrir a lista marca tudo como lido.
 *
 * Não há tempo real (a API fica num servidor que dorme): o número é consultado ao abrir a página, a cada minuto com a
 * aba visível e quando a aba volta a ser vista. Falhas ao consultar são ignoradas em silêncio (o sino só não atualiza).
 */
@Component({
  selector: 'app-sino',
  standalone: true,
  imports: [RouterLink, IconComponent, DateBrPipe],
  templateUrl: './sino.component.html',
  styleUrls: ['./sino.component.scss']
})
export class SinoComponent implements OnInit, OnDestroy {
  private readonly servico = inject(NotificacaoService);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  naoLidas = 0;
  aberto = false;
  carregando = false;
  erro: string | null = null;
  itens: Notificacao[] = [];

  private intervalo?: ReturnType<typeof setInterval>;

  /** "9+" quando passa de nove, para o número caber na bolinha. */
  get rotuloDoNumero(): string {
    return this.naoLidas > 9 ? '9+' : String(this.naoLidas);
  }

  get rotuloDoBotao(): string {
    if (this.naoLidas === 0) {
      return 'Notificações';
    }
    return this.naoLidas === 1 ? 'Notificações: 1 não lida' : `Notificações: ${this.naoLidas} não lidas`;
  }

  ngOnInit(): void {
    this.atualizarNumero();
    this.intervalo = setInterval(() => {
      if (!document.hidden) {
        this.atualizarNumero();
      }
    }, INTERVALO_DO_SINO_EM_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
  }

  /** Voltou para esta aba: já traz o número novo, sem esperar o próximo minuto. */
  @HostListener('document:visibilitychange')
  aoMudarDeAba(): void {
    if (!document.hidden) {
      this.atualizarNumero();
    }
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: Event): void {
    if (this.aberto && !this.elemento.nativeElement.contains(evento.target as Node)) {
      this.aberto = false;
    }
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    this.aberto = false;
  }

  alternar(): void {
    this.aberto = !this.aberto;
    if (this.aberto) {
      this.carregarLista();
    }
  }

  fechar(): void {
    this.aberto = false;
  }

  /** Para onde o aviso leva: o comentário vai direto à seção de comentários. */
  fragmentoDe(n: Notificacao): string | undefined {
    return n.tipo === 'COMENTARIO' ? 'comentarios' : undefined;
  }

  private atualizarNumero(): void {
    this.servico.contarNaoLidas().subscribe({
      next: total => (this.naoLidas = total),
      error: () => {
        // o sino só não atualiza; não vale incomodar a pessoa com um erro de segundo plano
      }
    });
  }

  private carregarLista(): void {
    this.carregando = true;
    this.erro = null;

    this.servico.listar().subscribe({
      next: pagina => {
        this.itens = pagina.conteudo;
        this.carregando = false;
        // a lista guarda o estado "não lida" de cada item para destacá-los; o número do sino zera ao abrir
        if (this.naoLidas > 0) {
          this.naoLidas = 0;
          this.servico.marcarTodasComoLidas().subscribe({ error: () => this.atualizarNumero() });
        }
      },
      error: erro => {
        this.carregando = false;
        this.erro = mensagemDeErro(erro, 'Não foi possível carregar as notificações.');
      }
    });
  }
}
