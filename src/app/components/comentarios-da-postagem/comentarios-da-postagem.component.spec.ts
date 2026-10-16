import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ComentarioPostagem } from '../../models/ComentarioPostagem';
import { Pagina } from '../../models/Pagina';
import { AuthService } from '../../services/auth.service';
import { ComentarioPostagemService } from '../../services/comentario-postagem.service';
import { ComentariosDaPostagemComponent } from './comentarios-da-postagem.component';

describe('ComentariosDaPostagemComponent', () => {
  let fixture: ComponentFixture<ComentariosDaPostagemComponent>;
  let component: ComentariosDaPostagemComponent;
  let servico: jasmine.SpyObj<ComentarioPostagemService>;
  let auth: jasmine.SpyObj<AuthService>;
  let el: HTMLElement;

  const comentario = (id: number, texto: string, podeExcluir = false): ComentarioPostagem => ({
    id,
    texto,
    data: '2026-10-10T10:00:00',
    usuario: { id: 5, nome: 'Ana', email: '', foto: '' },
    podeExcluir
  });

  const pagina = (conteudo: ComentarioPostagem[], opcoes: Partial<Pagina<ComentarioPostagem>> = {}): Pagina<ComentarioPostagem> => ({
    conteudo,
    pagina: 0,
    tamanho: 20,
    totalElementos: conteudo.length,
    totalPaginas: 1,
    ultima: true,
    ...opcoes
  });

  const abrir = (primeira: Observable<Pagina<ComentarioPostagem>>, logado = true) => {
    servico.listar.and.returnValue(primeira);
    auth.isLoggedIn.and.returnValue(logado);
    fixture = TestBed.createComponent(ComentariosDaPostagemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('postagemId', 7);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    servico = jasmine.createSpyObj('ComentarioPostagemService', ['listar', 'comentar', 'excluir']);
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUsuario']);
    auth.getUsuario.and.returnValue(null);
    TestBed.configureTestingModule({
      imports: [ComentariosDaPostagemComponent],
      providers: [provideRouter([]), { provide: ComentarioPostagemService, useValue: servico }, { provide: AuthService, useValue: auth }]
    });
  });

  it('carrega a primeira página e mostra autor, data, texto e o total', () => {
    abrir(of(pagina([comentario(1, 'Primeiro'), comentario(2, 'Segundo')])));

    expect(servico.listar).toHaveBeenCalledWith(7, 0);
    expect(el.querySelectorAll('.comentario').length).toBe(2);
    expect(el.querySelector('.comentario-autor')!.textContent).toBe('Ana');
    expect(el.querySelector('.comentario-texto')!.textContent).toBe('Primeiro');
    expect(el.querySelector('.comentarios-total')!.textContent).toContain('2');
  });

  it('sem comentários, convida a ser a primeira pessoa', () => {
    abrir(of(pagina([])));

    expect(el.textContent).toContain('Ainda não há comentários');
  });

  it('visitante não vê o formulário e é convidado a entrar (voltando para a postagem)', () => {
    abrir(of(pagina([])), false);

    expect(el.querySelector('form')).toBeNull();
    const entrar = el.querySelector<HTMLAnchorElement>('.comentarios-convite a[href^="/login"]')!;
    expect(entrar.getAttribute('href')).toContain('returnUrl=%2Fpostagens%2F7');
    expect(el.querySelector('.comentarios-convite a[href="/register"]')).not.toBeNull();
  });

  it('SEGURANÇA: HTML no comentário aparece como texto, nunca é executado', () => {
    abrir(of(pagina([comentario(1, '<img src=x onerror="window.__xss = true">')])));

    expect(el.querySelector('.comentario img[src="x"]')).toBeNull();
    expect(el.querySelector('.comentario-texto')!.textContent).toContain('<img src=x');
  });

  describe('comentar', () => {
    it('envia o texto aparado, limpa o campo, soma ao total e avisa quem mostra a contagem', () => {
      abrir(of(pagina([comentario(1, 'Primeiro')])));
      servico.comentar.and.returnValue(of(comentario(2, 'Novo', true)));
      const avisos: number[] = [];
      component.totalMudou.subscribe(n => avisos.push(n));

      component.texto.setValue('  Novo  ');
      component.enviar();
      fixture.detectChanges();

      expect(servico.comentar).toHaveBeenCalledWith(7, 'Novo');
      expect(component.texto.value).toBe('');
      expect(el.querySelectorAll('.comentario').length).toBe(2);
      expect(avisos).toEqual([2]);
    });

    it('não envia vazio nem passando do limite', () => {
      abrir(of(pagina([])));

      component.texto.setValue('   ');
      expect(component.podeEnviar).toBeFalse();
      component.texto.setValue('x'.repeat(281));
      expect(component.podeEnviar).toBeFalse();
      component.texto.setValue('x'.repeat(280));
      expect(component.podeEnviar).toBeTrue();
    });

    it('mostra o erro da API (ex.: limite de comentários) e mantém o texto', () => {
      abrir(of(pagina([])));
      servico.comentar.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 429, error: { detail: 'Você está comentando rápido demais.' } }))
      );

      component.texto.setValue('Oi');
      component.enviar();
      fixture.detectChanges();

      expect(el.querySelector('[role="alert"]')!.textContent).toContain('rápido demais');
      expect(component.texto.value).toBe('Oi');
      expect(component.enviando).toBeFalse();
    });

    it('com páginas por carregar, traz o resto até o fim para o novo comentário não aparecer fora de ordem', () => {
      servico.listar.and.returnValues(
        of(pagina([comentario(1, 'A')], { pagina: 0, ultima: false, totalElementos: 2, totalPaginas: 2 })),
        of(pagina([comentario(2, 'B'), comentario(3, 'Novo')], { pagina: 1, ultima: true, totalElementos: 3, totalPaginas: 2 }))
      );
      auth.isLoggedIn.and.returnValue(true);
      fixture = TestBed.createComponent(ComentariosDaPostagemComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('postagemId', 7);
      fixture.detectChanges();
      servico.comentar.and.returnValue(of(comentario(3, 'Novo', true)));

      component.texto.setValue('Novo');
      component.enviar();
      fixture.detectChanges();

      expect(servico.listar).toHaveBeenCalledWith(7, 1);
      expect(component.comentarios.map(c => c.id)).toEqual([1, 2, 3]);
    });
  });

  describe('ver mais', () => {
    it('com mais páginas mostra o botão e acrescenta a próxima ao clicar', () => {
      servico.listar.and.returnValues(
        of(pagina([comentario(1, 'A')], { pagina: 0, ultima: false, totalElementos: 2, totalPaginas: 2 })),
        of(pagina([comentario(2, 'B')], { pagina: 1, ultima: true, totalElementos: 2, totalPaginas: 2 }))
      );
      auth.isLoggedIn.and.returnValue(false);
      fixture = TestBed.createComponent(ComentariosDaPostagemComponent);
      fixture.componentRef.setInput('postagemId', 7);
      fixture.detectChanges();
      el = fixture.nativeElement;

      const botao = el.querySelector<HTMLButtonElement>('.comentarios-mais')!;
      botao.click();
      fixture.detectChanges();

      expect(servico.listar).toHaveBeenCalledWith(7, 1);
      expect(el.querySelectorAll('.comentario').length).toBe(2);
      expect(el.querySelector('.comentarios-mais')).toBeNull();
    });
  });

  describe('apagar', () => {
    it('só mostra o botão onde a API diz que pode', () => {
      abrir(of(pagina([comentario(1, 'Meu', true), comentario(2, 'De outra pessoa', false)])));

      const itens = el.querySelectorAll('.comentario');
      expect(itens[0].querySelector('.comentario-apagar')).not.toBeNull();
      expect(itens[1].querySelector('.comentario-apagar')).toBeNull();
    });

    it('pede confirmação, só apaga depois dela e tira da lista', () => {
      abrir(of(pagina([comentario(1, 'Meu', true)])));
      servico.excluir.and.returnValue(of(undefined));

      component.pedirExclusao(component.comentarios[0]);
      expect(servico.excluir).not.toHaveBeenCalled();

      component.confirmarExclusao();
      fixture.detectChanges();

      expect(servico.excluir).toHaveBeenCalledWith(7, 1);
      expect(el.querySelectorAll('.comentario').length).toBe(0);
      expect(component.total).toBe(0);
    });

    it('cancelar não apaga nada', () => {
      abrir(of(pagina([comentario(1, 'Meu', true)])));

      component.pedirExclusao(component.comentarios[0]);
      component.cancelarExclusao();

      expect(servico.excluir).not.toHaveBeenCalled();
      expect(component.paraExcluir).toBeNull();
    });

    it('mostra o erro quando a API recusa', () => {
      abrir(of(pagina([comentario(1, 'Meu', true)])));
      servico.excluir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Você não pode apagar este comentário.' } })));

      component.pedirExclusao(component.comentarios[0]);
      component.confirmarExclusao();
      fixture.detectChanges();

      expect(el.querySelector('[role="alert"]')!.textContent).toContain('não pode apagar');
      expect(el.querySelectorAll('.comentario').length).toBe(1);
    });
  });

  it('erro ao carregar: mostra o motivo e permite tentar de novo', () => {
    abrir(throwError(() => new HttpErrorResponse({ status: 500, error: { detail: 'Erro interno no servidor.' } })));

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Erro interno');
    servico.listar.and.returnValue(of(pagina([comentario(1, 'Voltou')])));
    el.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();

    expect(el.querySelectorAll('.comentario').length).toBe(1);
  });
});
