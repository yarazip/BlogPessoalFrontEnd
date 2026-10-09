import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const criar = () => {
    TestBed.resetTestingModule();
    return TestBed.inject(ThemeService);
  };

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark-mode', 'light-mode');
  });

  it('respeita a preferência salva', () => {
    localStorage.setItem('theme', 'dark');
    const service = criar();

    expect(service.isDarkMode()).toBeTrue();
    expect(document.documentElement.classList).toContain('dark-mode');
    expect(document.documentElement.classList).not.toContain('light-mode');
  });

  it('alterna, aplica as classes e salva a escolha', () => {
    localStorage.setItem('theme', 'light');
    const service = criar();

    service.toggleTheme();

    expect(service.escuro()).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList).toContain('dark-mode');

    service.toggleTheme();

    expect(service.escuro()).toBeFalse();
    expect(document.documentElement.classList).toContain('light-mode');
  });

  it('setTheme define o tema explicitamente', () => {
    const service = criar();

    service.setTheme('dark');

    expect(service.isDarkMode()).toBeTrue();
  });

  it('ignora valor inválido salvo e usa a preferência do sistema', () => {
    localStorage.setItem('theme', 'azul');
    const service = criar();

    expect(service.isDarkMode()).toBe(window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
});
