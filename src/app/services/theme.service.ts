import { Injectable, signal } from '@angular/core';

const CHAVE = 'theme';

/**
 * Única fonte do tema claro/escuro: guarda a preferência, aplica as classes no <html>
 * e expõe o estado como signal para quem precisar reagir (ex.: gráfico do dashboard).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _escuro = signal(this.preferenciaInicial());

  /** Somente leitura: use toggleTheme()/setTheme() para alterar. */
  readonly escuro = this._escuro.asReadonly();

  constructor() {
    this.aplicar();
  }

  isDarkMode(): boolean {
    return this._escuro();
  }

  toggleTheme(): void {
    this.setTheme(this._escuro() ? 'light' : 'dark');
  }

  setTheme(tema: 'dark' | 'light'): void {
    this._escuro.set(tema === 'dark');
    try {
      localStorage.setItem(CHAVE, tema);
    } catch {
      // armazenamento indisponível (modo privado): o tema vale só nesta sessão
    }
    this.aplicar();
  }

  private preferenciaInicial(): boolean {
    let salvo: string | null = null;
    try {
      salvo = localStorage.getItem(CHAVE);
    } catch {
      salvo = null;
    }
    if (salvo === 'dark' || salvo === 'light') {
      return salvo === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private aplicar(): void {
    const raiz = document.documentElement;
    raiz.classList.toggle('dark-mode', this._escuro());
    raiz.classList.toggle('light-mode', !this._escuro());
  }
}
