import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { criarJwt } from '../testing/jwt-teste';
import { AppComponent } from './app.component';

@Component({ standalone: true, template: '' })
class PaginaFalsaComponent {}

describe('AppComponent (esqueleto)', () => {
  const rotas = ['/', 'login', 'explorar', 'dashboard'].map(path => ({
    path: path === '/' ? '' : path,
    component: PaginaFalsaComponent
  }));

  const iniciar = (urlInicial: string, logado: boolean) => {
    localStorage.clear();
    if (logado) {
      localStorage.setItem('token', criarJwt(3600));
      localStorage.setItem('usuario', JSON.stringify({ id: 1, nome: 'Ana' }));
    }
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(rotas), provideHttpClient(), provideHttpClientTesting()]
    });
    // define a URL do navegador antes de criar o app (é o que o app lê para o estado inicial)
    TestBed.inject(Location).go(urlInicial);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };

  afterEach(() => localStorage.clear());

  it('já nasce com o cabeçalho certo, sem piscar o público antes da primeira navegação', () => {
    const { el } = iniciar('/explorar', true);

    // nenhuma navegação aconteceu ainda: o estado vem da URL do navegador
    expect(el.querySelector('app-dashboard-header')).not.toBeNull();
    expect(el.querySelector('app-header')).toBeNull();
  });

  it('logado em /explorar o cabeçalho continua o do usuário depois de navegar (regressão)', async () => {
    const { fixture, el } = iniciar('/dashboard', true);

    await TestBed.inject(Router).navigateByUrl('/explorar');
    fixture.detectChanges();

    expect(el.querySelector('app-dashboard-header')).not.toBeNull();
    expect(el.querySelector('app-header')).toBeNull();
  });

  it('logado, ao ir para o login mostra o cabeçalho público', async () => {
    const { fixture, el } = iniciar('/dashboard', true);

    await TestBed.inject(Router).navigateByUrl('/login');
    fixture.detectChanges();

    expect(el.querySelector('app-header')).not.toBeNull();
    expect(el.querySelector('app-dashboard-header')).toBeNull();
  });

  it('sem sessão, usa o cabeçalho público em qualquer página', async () => {
    const { fixture, el } = iniciar('/explorar', false);
    expect(el.querySelector('app-header')).not.toBeNull();

    await TestBed.inject(Router).navigateByUrl('/dashboard');
    fixture.detectChanges();

    expect(el.querySelector('app-header')).not.toBeNull();
    expect(el.querySelector('app-dashboard-header')).toBeNull();
  });

  it('o conteúdo reserva o espaço do cabeçalho fixo só quando ele é o do usuário', () => {
    expect(iniciar('/dashboard', true).el.querySelector('main')!.classList).toContain('com-cabecalho-fixo');

    TestBed.resetTestingModule();

    expect(iniciar('/login', false).el.querySelector('main')!.classList).not.toContain('com-cabecalho-fixo');
  });

  it('o conteúdo fica dentro de um <main> (landmark de acessibilidade) com o rodapé depois dele', () => {
    const { el } = iniciar('/login', false);

    expect(el.querySelector('main router-outlet')).not.toBeNull();
    expect(el.querySelector('main + app-footer')).not.toBeNull();
  });
});
