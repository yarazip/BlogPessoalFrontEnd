import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Reacoes, TipoReacao } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { ReacoesComponent, aplicarReacao } from './reacoes.component';

describe('aplicarReacao', () => {
  const base: Reacoes = { curtidas: 5, descurtidas: 2, minhaReacao: null };

  it('curtir soma uma curtida', () => {
    expect(aplicarReacao(base, 'CURTIDA')).toEqual({ curtidas: 6, descurtidas: 2, minhaReacao: 'CURTIDA' });
  });

  it('retirar a curtida tira uma curtida', () => {
    expect(aplicarReacao({ ...base, minhaReacao: 'CURTIDA' }, null)).toEqual({ curtidas: 4, descurtidas: 2, minhaReacao: null });
  });

  it('trocar de curtir para descurtir move a reação de um lado para o outro', () => {
    expect(aplicarReacao({ ...base, minhaReacao: 'CURTIDA' }, 'DESCURTIDA')).toEqual({
      curtidas: 4,
      descurtidas: 3,
      minhaReacao: 'DESCURTIDA'
    });
  });

  it('não muda o objeto original', () => {
    const original = { ...base };
    aplicarReacao(original, 'CURTIDA');

    expect(original).toEqual(base);
  });
});

describe('ReacoesComponent', () => {
  let fixture: ComponentFixture<ReacoesComponent>;
  let el: HTMLElement;
  let service: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  const criar = (curtidas = 12, descurtidas = 2, minha: TipoReacao | null = null) => {
    fixture = TestBed.createComponent(ReacoesComponent);
    fixture.componentRef.setInput('postagemId', 7);
    fixture.componentRef.setInput('curtidas', curtidas);
    fixture.componentRef.setInput('descurtidas', descurtidas);
    fixture.componentRef.setInput('minhaReacao', minha);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const botao = (tipo: 'curtir' | 'descurtir') => el.querySelector<HTMLButtonElement>(`.reacao-${tipo}`)!;
  const numero = (tipo: 'curtir' | 'descurtir') => botao(tipo).querySelector('.contagem')!.textContent;
  const icone = (tipo: 'curtir' | 'descurtir') => botao(tipo).querySelector('use')!.getAttribute('href');
  const tocar = (tipo: 'curtir' | 'descurtir') => {
    botao(tipo).click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('PostagemService', ['reagir']);
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    auth.isLoggedIn.and.returnValue(true);
    TestBed.configureTestingModule({
      imports: [ReacoesComponent],
      providers: [provideRouter([]), { provide: PostagemService, useValue: service }, { provide: AuthService, useValue: auth }]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  describe('o que aparece', () => {
    it('mostra os dois totais, inclusive o de descurtidas', () => {
      criar(12, 2);

      expect(numero('curtir')).toBe('12');
      expect(numero('descurtir')).toBe('2');
    });

    it('sem reação, os dois corações estão vazios e nenhum botão está ligado', () => {
      criar();

      expect(icone('curtir')).toContain('#icon-coracao');
      expect(icone('curtir')).not.toContain('cheio');
      expect(icone('descurtir')).toContain('#icon-coracao-partido');
      expect(icone('descurtir')).not.toContain('cheio');
      expect(botao('curtir').getAttribute('aria-pressed')).toBe('false');
      expect(botao('descurtir').getAttribute('aria-pressed')).toBe('false');
    });

    it('quem já curtiu vê o coração cheio e o botão ligado', () => {
      criar(12, 2, 'CURTIDA');

      expect(icone('curtir')).toContain('#icon-coracao-cheio');
      expect(botao('curtir').classList).toContain('ativa');
      expect(botao('curtir').getAttribute('aria-pressed')).toBe('true');
      expect(botao('descurtir').getAttribute('aria-pressed')).toBe('false');
    });

    it('quem já descurtiu vê o coração partido cheio', () => {
      criar(12, 2, 'DESCURTIDA');

      expect(icone('descurtir')).toContain('#icon-coracao-partido-cheio');
      expect(botao('descurtir').getAttribute('aria-pressed')).toBe('true');
    });

    it('os rótulos dizem o total e o que o toque faz (leitores de tela)', () => {
      criar(1, 0, 'CURTIDA');

      expect(botao('curtir').getAttribute('aria-label')).toBe('1 curtida. Retirar curtida');
      expect(botao('descurtir').getAttribute('aria-label')).toBe('0 descurtidas. Descurtir');
    });
  });

  describe('visitante', () => {
    beforeEach(() => auth.isLoggedIn.and.returnValue(false));

    it('ao tocar é levado ao login, voltando para esta página depois, e a API não é chamada', () => {
      criar();

      tocar('curtir');

      expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: router.url } });
      expect(service.reagir).not.toHaveBeenCalled();
      expect(numero('curtir')).toBe('12');
    });
  });

  describe('quem está logado', () => {
    it('curtir envia CURTIDA e o número sobe na hora, antes da resposta da API', () => {
      const resposta = new Subject<Reacoes>();
      service.reagir.and.returnValue(resposta);
      criar(12, 2);

      tocar('curtir');

      expect(service.reagir).toHaveBeenCalledOnceWith(7, 'CURTIDA');
      expect(numero('curtir')).toBe('13');
      expect(icone('curtir')).toContain('#icon-coracao-cheio');

      resposta.next({ curtidas: 13, descurtidas: 2, minhaReacao: 'CURTIDA' });
      fixture.detectChanges();
      expect(numero('curtir')).toBe('13');
    });

    it('os números da API valem mais que a conta local', () => {
      service.reagir.and.returnValue(of({ curtidas: 20, descurtidas: 2, minhaReacao: 'CURTIDA' }));
      criar(12, 2);

      tocar('curtir');

      expect(numero('curtir')).toBe('20'); // outras pessoas curtiram nesse meio tempo
    });

    it('tocar de novo na curtida RETIRA a curtida (envia null)', () => {
      service.reagir.and.returnValue(of({ curtidas: 11, descurtidas: 2, minhaReacao: null }));
      criar(12, 2, 'CURTIDA');

      tocar('curtir');

      expect(service.reagir).toHaveBeenCalledOnceWith(7, null);
      expect(numero('curtir')).toBe('11');
      expect(icone('curtir')).not.toContain('cheio');
      expect(botao('curtir').getAttribute('aria-pressed')).toBe('false');
    });

    it('tocar de novo na descurtida também retira', () => {
      service.reagir.and.returnValue(of({ curtidas: 12, descurtidas: 1, minhaReacao: null }));
      criar(12, 2, 'DESCURTIDA');

      tocar('descurtir');

      expect(service.reagir).toHaveBeenCalledOnceWith(7, null);
      expect(numero('descurtir')).toBe('1');
    });

    it('descurtir depois de curtir troca a reação: a curtida sai e a descurtida entra', () => {
      service.reagir.and.returnValue(of({ curtidas: 11, descurtidas: 3, minhaReacao: 'DESCURTIDA' }));
      criar(12, 2, 'CURTIDA');

      tocar('descurtir');

      expect(service.reagir).toHaveBeenCalledOnceWith(7, 'DESCURTIDA');
      expect(numero('curtir')).toBe('11');
      expect(numero('descurtir')).toBe('3');
      expect(botao('curtir').getAttribute('aria-pressed')).toBe('false');
      expect(botao('descurtir').getAttribute('aria-pressed')).toBe('true');
    });

    it('se a API falhar, volta ao que era e mostra o erro', () => {
      service.reagir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      criar(12, 2);

      tocar('curtir');

      expect(numero('curtir')).toBe('12');
      expect(icone('curtir')).not.toContain('cheio');
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('Não foi possível registrar sua reação');
    });

    it('o erro some na próxima tentativa que dá certo', () => {
      service.reagir.and.returnValues(
        throwError(() => new HttpErrorResponse({ status: 500 })),
        of({ curtidas: 13, descurtidas: 2, minhaReacao: 'CURTIDA' })
      );
      criar(12, 2);

      tocar('curtir');
      tocar('curtir');

      expect(el.querySelector('[role="alert"]')).toBeNull();
      expect(numero('curtir')).toBe('13');
    });

    it('enquanto uma reação está sendo enviada, outros toques são ignorados', () => {
      service.reagir.and.returnValue(new Subject<Reacoes>());
      criar(12, 2);

      tocar('curtir');
      tocar('curtir');
      tocar('descurtir');

      expect(service.reagir).toHaveBeenCalledTimes(1);
    });
  });
});
