import { Directive, ElementRef, InjectionToken, OnDestroy, OnInit, inject, output } from '@angular/core';

/** Construtor do IntersectionObserver; os testes trocam por um falso para disparar a rolagem à mão. */
export const OBSERVADOR_DE_INTERSECAO = new InjectionToken<typeof IntersectionObserver>('OBSERVADOR_DE_INTERSECAO', {
  providedIn: 'root',
  factory: () => IntersectionObserver
});

/** Distância antes do fim da lista em que o próximo trecho já começa a carregar. */
const MARGEM_ANTECIPADA = '400px';

/**
 * Avisa (`visivel`) quando o elemento entra na área visível, para carregar mais itens na rolagem.
 * Uso: <div appSentinela (visivel)="carregarMais()"></div> no fim da lista.
 */
@Directive({
  selector: '[appSentinela]',
  standalone: true
})
export class SentinelaDirective implements OnInit, OnDestroy {
  readonly visivel = output<void>();

  private readonly elemento = inject<ElementRef<Element>>(ElementRef);
  private readonly Observador = inject(OBSERVADOR_DE_INTERSECAO);
  private observador?: IntersectionObserver;

  ngOnInit(): void {
    this.observador = new this.Observador(
      entradas => {
        if (entradas.some(entrada => entrada.isIntersecting)) {
          this.visivel.emit();
        }
      },
      { rootMargin: MARGEM_ANTECIPADA }
    );
    this.observador.observe(this.elemento.nativeElement);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
