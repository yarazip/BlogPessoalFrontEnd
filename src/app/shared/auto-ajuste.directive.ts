import { AfterViewInit, DestroyRef, Directive, ElementRef, HostListener, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';

/**
 * Faz o <textarea> crescer junto com o texto, em vez de ter uma barra de rolagem interna. A altura mínima fica a
 * cargo do CSS (min-height) ou do atributo rows. Também acompanha quando o texto muda por código (patchValue).
 */
@Directive({
  selector: 'textarea[appAutoAjuste]',
  standalone: true
})
export class AutoAjusteDirective implements AfterViewInit {
  private readonly elemento = inject<ElementRef<HTMLTextAreaElement>>(ElementRef).nativeElement;
  private readonly controle = inject(NgControl, { optional: true, self: true });
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.elemento.style.overflowY = 'hidden';
    this.ajustar();
    // o valor definido por código (ex.: carregar a postagem, restaurar o rascunho) chega depois do primeiro ajuste
    this.controle?.valueChanges?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => queueMicrotask(() => this.ajustar()));
  }

  @HostListener('input')
  ajustar(): void {
    this.elemento.style.height = 'auto';
    this.elemento.style.height = `${this.elemento.scrollHeight}px`;
  }
}
