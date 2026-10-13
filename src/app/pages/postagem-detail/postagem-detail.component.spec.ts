import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Postagem } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { FonteService } from '../../services/fonte.service';
import { PostagemService } from '../../services/postagem.service';
import { PostagemDetailComponent } from './postagem-detail.component';

describe('PostagemDetailComponent', () => {
  let fixture: ComponentFixture<PostagemDetailComponent>;
  let el: HTMLElement;
  let service: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;
  let fontes: jasmine.SpyObj<FonteService>;
  let router: Router;
  // a rota é um objeto simples que cada teste ajusta antes de criar o componente
  let rota: { snapshot: { paramMap: ParamMap } };

  const blog = (extra: Partial<Postagem> = {}): Postagem => ({
    id: 7,
    tipo: 'BLOG',
    titulo: 'Meu blog',
    texto: 'Linha 1\nLinha 2 do texto completo',
    data: '2026-10-09T15:30:00',
    tema: { id: 1, descricao: "'Tecnologia'" },
    usuario: { id: 3, nome: 'Bia' },
    ...extra
  });

  const abrir = (id: string, resposta: Observable<Postagem> = of(blog())) => {
    service.getById.and.returnValue(resposta);
    rota.snapshot = { paramMap: convertToParamMap({ id }) };
    fixture = TestBed.createComponent(PostagemDetailComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    rota = { snapshot: { paramMap: convertToParamMap({}) } };
    service = jasmine.createSpyObj('PostagemService', ['getById', 'delete']);
    auth = jasmine.createSpyObj('AuthService', ['getUsuario']);
    fontes = jasmine.createSpyObj('FonteService', ['carregar', 'carregarTodas']);
    auth.getUsuario.and.returnValue(null);
    TestBed.configureTestingModule({
      imports: [PostagemDetailComponent],
      providers: [
        provideRouter([]),
        { provide: PostagemService, useValue: service },
        { provide: AuthService, useValue: auth },
        { provide: FonteService, useValue: fontes },
        { provide: ActivatedRoute, useValue: rota }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('mostra o blog completo: título, autor com link para o perfil, data, tema e texto', () => {
    abrir('7');

    expect(el.querySelector('.detalhe-titulo')!.textContent).toBe('Meu blog');
    expect(el.querySelector('.detalhe-nome')!.textContent).toBe('Bia');
    expect(el.querySelector('.detalhe-nome')!.getAttribute('href')).toBe('/perfil/3');
    expect(el.querySelector('.detalhe-data')!.textContent).toBe('09/10/2026 15:30');
    expect(el.querySelector('.detalhe-tema')!.textContent).toBe('#Tecnologia');
    expect(el.querySelector('.detalhe-texto')!.textContent).toBe('Linha 1\nLinha 2 do texto completo');
  });

  it('o rascunho aparece na fonte escolhida pela autora e a fonte é pedida ao serviço', () => {
    abrir('7', of(blog({ fonte: 'FRAUNCES' })));

    expect((el.querySelector('.detalhe-titulo') as HTMLElement).style.fontFamily).toContain('Fraunces');
    expect((el.querySelector('.detalhe-titulo') as HTMLElement).style.fontWeight).toBe('700');
    expect((el.querySelector('.detalhe-texto') as HTMLElement).style.fontFamily).toContain('Fraunces');
    expect(fontes.carregar).toHaveBeenCalledWith('FRAUNCES');
  });

  it('sem fonte escolhida, vale o visual padrão do site', () => {
    abrir('7', of(blog({ fonte: null })));

    expect((el.querySelector('.detalhe-titulo') as HTMLElement).style.fontFamily).toBe('');
    expect((el.querySelector('.detalhe-texto') as HTMLElement).style.fontFamily).toBe('');
  });

  it('mostra os botões de curtir e descurtir com os totais', () => {
    abrir('7', of(blog({ curtidas: 5, descurtidas: 1, minhaReacao: 'DESCURTIDA' })));

    const numeros = Array.from(el.querySelectorAll('app-reacoes .contagem')).map(n => n.textContent);
    expect(numeros).toEqual(['5', '1']);
    expect(el.querySelector('.reacao-descurtir')!.classList).toContain('ativa');
  });

  it('preserva as quebras de linha por CSS, sem inserir <br>', () => {
    abrir('7');
    const texto = el.querySelector('.detalhe-texto') as HTMLElement;

    expect(texto.querySelector('br')).toBeNull();
    expect(getComputedStyle(texto).whiteSpace).toBe('pre-line');
  });

  it('SEGURANÇA: HTML no texto é mostrado como texto, nunca executado', () => {
    abrir('7', of(blog({ texto: '<img src=x onerror="window.__xss = true"><script>1</script>' })));

    expect(el.querySelector('.detalhe-texto img')).toBeNull();
    expect(el.querySelector('.detalhe-texto script')).toBeNull();
    expect(el.querySelector('.detalhe-texto')!.textContent).toContain('<img src=x');
  });

  it('um comentário aberto pelo link aparece sem título', () => {
    abrir('9', of(blog({ id: 9, tipo: 'COMENTARIO', titulo: null, tema: null, texto: 'Só um comentário' })));

    expect(el.querySelector('.detalhe-titulo')).toBeNull();
    expect(el.querySelector('.detalhe-tema')).toBeNull();
    expect(el.querySelector('.detalhe-texto')!.classList).toContain('detalhe-comentario');
  });

  it('postagem inexistente mostra o aviso e o caminho de volta ao feed', () => {
    abrir('999', throwError(() => new HttpErrorResponse({ status: 404 })));

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.querySelector('.detalhe-voltar')!.getAttribute('href')).toBe('/explorar');
  });

  it('id inválido volta para o feed (que é público), não para uma área que exige login', () => {
    abrir('abc');

    expect(router.navigate).toHaveBeenCalledWith(['/explorar']);
    expect(service.getById).not.toHaveBeenCalled();
  });

  describe('editar e excluir', () => {
    it('visitante e outras pessoas não veem as ações', () => {
      abrir('7');
      expect(el.querySelector('.detalhe-acoes')).toBeNull();

      auth.getUsuario.and.returnValue({ id: 99 });
      abrir('7');
      expect(el.querySelector('.detalhe-acoes')).toBeNull();
    });

    it('a autora vê Editar e Excluir', () => {
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      expect(el.querySelectorAll('.detalhe-acoes button').length).toBe(2);
    });

    it('Editar leva ao formulário da postagem', () => {
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      el.querySelectorAll<HTMLButtonElement>('.detalhe-acoes button')[0].click();

      expect(router.navigate).toHaveBeenCalledWith(['/postagens', 7, 'editar']);
    });

    it('Excluir confirma, apaga e volta para Minhas postagens', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      service.delete.and.returnValue(of(undefined));
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      el.querySelectorAll<HTMLButtonElement>('.detalhe-acoes button')[1].click();

      expect(service.delete).toHaveBeenCalledOnceWith(7);
      expect(router.navigate).toHaveBeenCalledWith(['/postagens']);
    });

    it('sem confirmação nada é apagado', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      el.querySelectorAll<HTMLButtonElement>('.detalhe-acoes button')[1].click();

      expect(service.delete).not.toHaveBeenCalled();
    });
  });
});
