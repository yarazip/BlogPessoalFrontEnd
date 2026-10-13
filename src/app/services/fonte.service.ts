import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { FONTES, FontePostagem, fonteDe } from '../models/Fonte';

/**
 * Carrega as fontes das postagens sob demanda: o CSS de uma fonte só é pedido ao Google Fonts quando uma
 * postagem (ou o seletor do formulário) a usa, uma vez só. Assim a página inicial não paga pelas 7 fontes.
 * O CSP do Netlify já libera fonts.googleapis.com e fonts.gstatic.com.
 */
@Injectable({ providedIn: 'root' })
export class FonteService {
  private readonly documento = inject(DOCUMENT);
  private readonly pedidas = new Set<FontePostagem>();

  /** Pede a fonte (se ainda não pediu). Nulo e valores desconhecidos são ignorados. */
  carregar(id: FontePostagem | null | undefined): void {
    const fonte = fonteDe(id);
    if (!fonte || this.pedidas.has(fonte.id)) {
      return;
    }
    this.pedidas.add(fonte.id);

    const link = this.documento.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fonte.google}&display=swap`;
    link.dataset['fonte'] = fonte.id;
    this.documento.head.appendChild(link);
  }

  /** Para o seletor do formulário, que mostra cada opção na própria fonte. */
  carregarTodas(): void {
    FONTES.forEach(fonte => this.carregar(fonte.id));
  }
}
