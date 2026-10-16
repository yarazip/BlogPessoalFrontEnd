import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Notificacao } from '../../models/Notificacao';
import { Pagina } from '../../models/Pagina';
import { NotificacaoService } from '../../services/notificacao.service';
import { INTERVALO_DO_SINO_EM_MS, SinoComponent } from './sino.component';

describe('SinoComponent', () => {
  let fixture: ComponentFixture<SinoComponent>;
  let component: SinoComponent;
  let servico: jasmine.SpyObj<NotificacaoService>;
  let el: HTMLElement;

  const curtida = (id: number, lida = false): Notificacao => ({
    id,
    tipo: 'CURTIDA',
    lida,
    data: '2026-10-10T10:00:00',
    ator: { id: 5, nome: 'Ana', email: '', foto: '' },
    postagemId: 9,
    postagemResumo: 'Meu rabisco'
  });

  const comentario = (id: number): Notificacao => ({
    ...curtida(id),
    tipo: 'COMENTARIO',
    ator: { id: 6, nome: 'Bia', email: '', foto: '' },
    postagemResumo: 'Meu blog',
    comentarioResumo: 'Adorei esse texto'
  });

  const pagina = (conteudo: Notificacao[]): Pagina<Notificacao> => ({
    conteudo,
    pagina: 0,
    tamanho: 15,
    totalElementos: conteudo.length,
    totalPaginas: 1,
    ultima: true
  });

  const criar = (naoLidas: Observable<number> = of(0)) => {
    servico.contarNaoLidas.and.returnValue(naoLidas);
    fixture = TestBed.createComponent(SinoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const botao = () => el.querySelector<HTMLButtonElement>('.sino-botao')!;

  beforeEach(() => {
    servico = jasmine.createSpyObj('NotificacaoService', ['contarNaoLidas', 'listar', 'marcarTodasComoLidas']);
    servico.listar.and.returnValue(of(pagina([])));
    servico.marcarTodasComoLidas.and.returnValue(of(undefined));
    TestBed.configureTestingModule({
      imports: [SinoComponent],
      providers: [provideRouter([]), { provide: NotificacaoService, useValue: servico }]
    });
  });

  it('ao aparecer consulta o número e mostra a bolinha só quando há não lidas', () => {
    criar(of(3));

    expect(servico.contarNaoLidas).toHaveBeenCalledTimes(1);
    expect(el.querySelector('.sino-numero')!.textContent!.trim()).toBe('3');
    expect(botao().getAttribute('aria-label')).toBe('Notificações: 3 não lidas');
  });

  it('sem não lidas, não mostra a bolinha', () => {
    criar(of(0));

    expect(el.querySelector('.sino-numero')).toBeNull();
    expect(botao().getAttribute('aria-label')).toBe('Notificações');
  });

  it('passando de nove, mostra "9+" e no singular fala "1 não lida"', () => {
    criar(of(23));
    expect(el.querySelector('.sino-numero')!.textContent!.trim()).toBe('9+');

    component.naoLidas = 1;
    fixture.detectChanges();
    expect(botao().getAttribute('aria-label')).toBe('Notificações: 1 não lida');
  });

  it('se a consulta falhar, o sino fica quieto (sem erro na tela)', () => {
    criar(throwError(() => new HttpErrorResponse({ status: 500 })));

    expect(el.querySelector('.sino-numero')).toBeNull();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  describe('lista', () => {
    it('ao clicar abre o painel com quem curtiu e comentou, e o link certo de cada aviso', () => {
      servico.listar.and.returnValue(of(pagina([comentario(2), curtida(1)])));
      criar(of(2));

      botao().click();
      fixture.detectChanges();

      expect(botao().getAttribute('aria-expanded')).toBe('true');
      const itens = el.querySelectorAll('.sino-item');
      expect(itens.length).toBe(2);
      expect(itens[0].textContent).toContain('Bia');
      expect(itens[0].textContent).toContain('comentou na sua postagem');
      expect(itens[0].textContent).toContain('Adorei esse texto');
      expect(itens[0].getAttribute('href')).toBe('/postagens/9#comentarios');
      expect(itens[1].textContent).toContain('Ana');
      expect(itens[1].textContent).toContain('curtiu sua postagem');
      expect(itens[1].getAttribute('href')).toBe('/postagens/9');
    });

    it('abrir marca tudo como lido: o número zera, mas os itens novos seguem destacados na lista', () => {
      servico.listar.and.returnValue(of(pagina([curtida(1, false), curtida(2, true)])));
      criar(of(1));

      botao().click();
      fixture.detectChanges();

      expect(servico.marcarTodasComoLidas).toHaveBeenCalledTimes(1);
      expect(el.querySelector('.sino-numero')).toBeNull();
      const itens = el.querySelectorAll('.sino-item');
      expect(itens[0].classList).toContain('nao-lida');
      expect(itens[1].classList).not.toContain('nao-lida');
    });

    it('sem não lidas, abrir não chama a API de marcar', () => {
      servico.listar.and.returnValue(of(pagina([curtida(1, true)])));
      criar(of(0));

      botao().click();

      expect(servico.marcarTodasComoLidas).not.toHaveBeenCalled();
    });

    it('lista vazia mostra a mensagem de "nada por aqui"', () => {
      criar(of(0));

      botao().click();
      fixture.detectChanges();

      expect(el.textContent).toContain('Nada por aqui ainda');
    });

    it('erro ao carregar mostra o motivo, e o número continua', () => {
      servico.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { detail: 'Erro interno no servidor.' } })));
      criar(of(2));

      botao().click();
      fixture.detectChanges();

      expect(el.querySelector('[role="alert"]')!.textContent).toContain('Erro interno');
      expect(servico.marcarTodasComoLidas).not.toHaveBeenCalled();
      expect(component.naoLidas).toBe(2);
    });

    it('clicar de novo, Esc ou clicar fora fecham o painel', () => {
      criar(of(0));

      botao().click();
      fixture.detectChanges();
      botao().click();
      fixture.detectChanges();
      expect(el.querySelector('.sino-painel')).toBeNull();

      botao().click();
      fixture.detectChanges();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      fixture.detectChanges();
      expect(el.querySelector('.sino-painel')).toBeNull();

      botao().click();
      fixture.detectChanges();
      document.body.click();
      fixture.detectChanges();
      expect(el.querySelector('.sino-painel')).toBeNull();
    });

    it('clicar num aviso leva à postagem e fecha o painel', () => {
      servico.listar.and.returnValue(of(pagina([curtida(1)])));
      criar(of(0));
      botao().click();
      fixture.detectChanges();

      el.querySelector<HTMLAnchorElement>('.sino-item')!.click();
      fixture.detectChanges();

      expect(el.querySelector('.sino-painel')).toBeNull();
    });
  });

  describe('atualização automática', () => {
    it('consulta de novo a cada minuto e para ao sair da tela', fakeAsync(() => {
      criar(of(0));
      expect(servico.contarNaoLidas).toHaveBeenCalledTimes(1);

      tick(INTERVALO_DO_SINO_EM_MS);
      expect(servico.contarNaoLidas).toHaveBeenCalledTimes(2);
      tick(INTERVALO_DO_SINO_EM_MS);
      expect(servico.contarNaoLidas).toHaveBeenCalledTimes(3);

      fixture.destroy();
      tick(INTERVALO_DO_SINO_EM_MS * 3);
      expect(servico.contarNaoLidas).toHaveBeenCalledTimes(3);
      discardPeriodicTasks();
    }));

    it('com a aba escondida não consulta', fakeAsync(() => {
      criar(of(0));
      spyOnProperty(document, 'hidden', 'get').and.returnValue(true);

      tick(INTERVALO_DO_SINO_EM_MS * 2);

      expect(servico.contarNaoLidas).toHaveBeenCalledTimes(1);
      fixture.destroy();
      discardPeriodicTasks();
    }));

    it('ao voltar para a aba, atualiza na hora', fakeAsync(() => {
      criar(of(0));

      component.aoMudarDeAba();

      expect(servico.contarNaoLidas).toHaveBeenCalledTimes(2);
      fixture.destroy();
      discardPeriodicTasks();
    }));
  });
});
