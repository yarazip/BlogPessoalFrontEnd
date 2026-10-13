import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Aviso } from '../../models/Aviso';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent (Insights do Blogify)', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let el: HTMLElement;
  let service: jasmine.SpyObj<DashboardService>;
  let auth: jasmine.SpyObj<AuthService>;

  const aviso = (id: number, titulo: string): Aviso => ({ id, titulo, texto: `Texto de ${titulo}`, data: '2026-10-09T15:30:00' });

  const criar = (opcoes: { admin?: boolean; avisos?: Aviso[] } = {}) => {
    auth.isAdmin.and.returnValue(opcoes.admin ?? false);
    service.getAvisos.and.returnValue(of(opcoes.avisos ?? []));
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const titulos = () => Array.from(el.querySelectorAll('.novidade h4')).map(h => h.textContent);

  const preencher = (titulo: string, texto: string) => {
    const t = el.querySelector<HTMLInputElement>('#aviso-titulo')!;
    const x = el.querySelector<HTMLTextAreaElement>('#aviso-texto')!;
    t.value = titulo;
    t.dispatchEvent(new Event('input'));
    x.value = texto;
    x.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    localStorage.clear();
    service = jasmine.createSpyObj('DashboardService', [
      'getUserCount', 'getPostCount', 'getPostStats', 'getAvisos', 'criarAviso', 'excluirAviso'
    ]);
    service.getUserCount.and.returnValue(of(12));
    service.getPostCount.and.returnValue(of(8));
    service.getPostStats.and.returnValue(of([{ day: 'Domingo', count: 2 }]));
    auth = jasmine.createSpyObj('AuthService', ['isAdmin']);
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: service },
        { provide: AuthService, useValue: auth }
      ]
    });
  });

  it('é sobre o site, não sobre a pessoa: sem saudação nem atalhos pessoais', () => {
    criar();

    expect(el.querySelector('.insights-topo')!.textContent).toContain('Números oficiais do site');
    expect(el.textContent).not.toContain('Bem-vindo');
    expect(el.querySelector('.action-btn')).toBeNull();
  });

  it('mostra a quantidade de usuários e de postagens', () => {
    criar();

    const valores = Array.from(el.querySelectorAll('.stat-value')).map(v => v.textContent);
    expect(valores).toEqual(['12', '8']);
  });

  describe('novidades', () => {
    it('lista as novidades na ordem em que a API devolve (mais recentes primeiro)', () => {
      criar({ avisos: [aviso(2, 'Segunda'), aviso(1, 'Primeira')] });

      expect(titulos()).toEqual(['Segunda', 'Primeira']);
      expect(el.querySelector('.novidade-data')!.textContent).toBe('09/10/2026');
    });

    it('mostra uma mensagem quando não há novidades', () => {
      criar({ avisos: [] });

      expect(el.textContent).toContain('Nenhuma novidade por enquanto');
    });

    it('SEGURANÇA: HTML no texto de uma novidade aparece como texto, nunca é executado', () => {
      criar({ avisos: [{ ...aviso(1, 'x'), texto: '<img src=x onerror="window.__xss = true">' }] });

      expect(el.querySelector('.novidade-texto img')).toBeNull();
      expect(el.querySelector('.novidade-texto')!.textContent).toContain('<img src=x');
    });

    it('mostra erro com "Tentar de novo" quando a API falha, e recarrega ao tentar', () => {
      auth.isAdmin.and.returnValue(false);
      service.getAvisos.and.returnValues(throwError(() => new HttpErrorResponse({ status: 500 })), of([aviso(1, 'Voltou')]));
      fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      el = fixture.nativeElement;

      expect(el.querySelector('.novidades [role="alert"]')).not.toBeNull();

      el.querySelector<HTMLButtonElement>('.btn-tentar')!.click();
      fixture.detectChanges();

      expect(titulos()).toEqual(['Voltou']);
    });
  });

  describe('para quem não é administrador', () => {
    it('não vê o formulário de publicação nem o botão de excluir', () => {
      criar({ admin: false, avisos: [aviso(1, 'Uma')] });

      expect(el.querySelector('.novidade-form')).toBeNull();
      expect(el.querySelector('.novidade-excluir')).toBeNull();
    });
  });

  describe('para o administrador', () => {
    it('publica uma novidade, que vai para o topo da lista, e limpa o formulário', () => {
      service.criarAviso.and.returnValue(of(aviso(2, 'Nova')));
      criar({ admin: true, avisos: [aviso(1, 'Antiga')] });

      preencher('Nova', 'Texto da nova');
      el.querySelector<HTMLFormElement>('.novidade-form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(service.criarAviso).toHaveBeenCalledOnceWith({ titulo: 'Nova', texto: 'Texto da nova' });
      expect(titulos()).toEqual(['Nova', 'Antiga']);
      expect(el.querySelector<HTMLInputElement>('#aviso-titulo')!.value).toBe('');
    });

    it('não envia um formulário vazio', () => {
      criar({ admin: true });

      el.querySelector<HTMLFormElement>('.novidade-form')!.dispatchEvent(new Event('submit'));

      expect(service.criarAviso).not.toHaveBeenCalled();
    });

    it('mostra o erro da API (por exemplo 403) sem perder o que digitou', () => {
      service.criarAviso.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
      criar({ admin: true });

      preencher('Título', 'Texto');
      el.querySelector<HTMLFormElement>('.novidade-form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      expect(el.querySelector('.mensagem-erro')).not.toBeNull();
      expect(el.querySelector<HTMLInputElement>('#aviso-titulo')!.value).toBe('Título');
    });

    it('exclui uma novidade e a tira da lista', () => {
      service.excluirAviso.and.returnValue(of(undefined));
      criar({ admin: true, avisos: [aviso(2, 'Fica'), aviso(1, 'Sai')] });

      el.querySelectorAll<HTMLButtonElement>('.novidade-excluir')[1].click();
      fixture.detectChanges();

      expect(service.excluirAviso).toHaveBeenCalledOnceWith(1);
      expect(titulos()).toEqual(['Fica']);
    });
  });
});
