import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { PostagemService } from '../../services/postagem.service';
import { Pagina } from '../models/Pagina';
import { Postagem } from '../models/Postagem';
import { ExplorarComponent } from './explorar.component';

describe('ExplorarComponent', () => {
  let fixture: ComponentFixture<ExplorarComponent>;
  let service: jasmine.SpyObj<PostagemService>;

  const postagem = (texto: string, id = 1): Postagem => ({
    id,
    titulo: `Título ${id}`,
    texto,
    data: '2024-01-10T15:30:00Z',
    usuario: { id: 1, nome: 'Ana' }
  });

  const pagina = (conteudo: Postagem[], numero: number, ultima: boolean): Pagina<Postagem> => ({
    conteudo,
    pagina: numero,
    tamanho: 10,
    totalElementos: conteudo.length,
    totalPaginas: ultima ? numero + 1 : numero + 2,
    ultima
  });

  const criar = (resposta: Observable<Pagina<Postagem>>) => {
    service.getPagina.and.returnValue(resposta);
    fixture = TestBed.createComponent(ExplorarComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    service = jasmine.createSpyObj('PostagemService', ['getPagina']);
    TestBed.configureTestingModule({
      imports: [ExplorarComponent],
      providers: [{ provide: PostagemService, useValue: service }]
    });
  });

  it('SEGURANÇA: HTML no texto da postagem é mostrado como texto, nunca executado', () => {
    const malicioso = '<img src=x onerror="window.__xss = true"><script>window.__xss = true</script>';
    (window as unknown as { __xss?: boolean }).__xss = false;

    const el = criar(of(pagina([postagem(malicioso)], 0, true)));

    expect(el.querySelector('.texto-postagem img')).toBeNull();
    expect(el.querySelector('.texto-postagem script')).toBeNull();
    expect(el.querySelector('.texto-postagem')!.textContent).toContain('<img src=x');
    expect((window as unknown as { __xss?: boolean }).__xss).toBeFalse();
  });

  it('preserva as quebras de linha por CSS, sem inserir <br>', () => {
    const el = criar(of(pagina([postagem('linha 1\nlinha 2')], 0, true)));
    const texto = el.querySelector('.texto-postagem') as HTMLElement;

    expect(texto.textContent).toBe('linha 1\nlinha 2');
    expect(texto.querySelector('br')).toBeNull();
    expect(getComputedStyle(texto).whiteSpace).toBe('pre-line');
  });

  it('usa a foto padrão quando o autor não tem foto', () => {
    const el = criar(of(pagina([postagem('texto')], 0, true)));

    expect((el.querySelector('img.foto-perfil') as HTMLImageElement).getAttribute('src')).toBe('assets/img/sem-foto.svg');
  });

  it('mostra mensagem quando não há postagens', () => {
    expect(criar(of(pagina([], 0, true))).textContent).toContain('Ainda não há postagens');
  });

  it('mostra erro quando a API falha', () => {
    const el = criar(throwError(() => new Error('falhou')));

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Não foi possível carregar as postagens');
  });

  describe('paginação', () => {
    const botao = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.btn-carregar-mais');

    it('pede a primeira página com o tamanho padrão', () => {
      criar(of(pagina([postagem('a')], 0, true)));

      expect(service.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10 });
    });

    it('só mostra "Carregar mais" enquanto houver mais páginas', () => {
      criar(of(pagina([postagem('a')], 0, false)));
      expect(botao()).not.toBeNull();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [ExplorarComponent], providers: [{ provide: PostagemService, useValue: service }] });
      criar(of(pagina([postagem('a')], 0, true)));
      expect(botao()).toBeNull();
    });

    it('acrescenta a próxima página ao feed, sem repetir nem perder itens', () => {
      service.getPagina.and.returnValues(
        of(pagina([postagem('um', 1), postagem('dois', 2)], 0, false)),
        of(pagina([postagem('três', 3)], 1, true))
      );
      fixture = TestBed.createComponent(ExplorarComponent);
      fixture.detectChanges();

      botao()!.click();
      fixture.detectChanges();

      expect(service.getPagina.calls.allArgs()).toEqual([[{ page: 0, size: 10 }], [{ page: 1, size: 10 }]]);
      const titulos = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('article h3')).map(h => h.textContent);
      expect(titulos).toEqual(['Título 1', 'Título 2', 'Título 3']);
      expect(botao()).toBeNull();
    });

    it('um erro ao carregar mais mantém o que já estava na tela e permite tentar de novo', () => {
      service.getPagina.and.returnValues(
        of(pagina([postagem('um', 1)], 0, false)),
        throwError(() => new Error('falhou')),
        of(pagina([postagem('dois', 2)], 1, true))
      );
      fixture = TestBed.createComponent(ExplorarComponent);
      fixture.detectChanges();

      botao()!.click();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelectorAll('article').length).toBe(1);
      expect(el.querySelector('[role="alert"]')).not.toBeNull();
      expect(botao()).not.toBeNull();

      botao()!.click();
      fixture.detectChanges();

      expect(el.querySelectorAll('article').length).toBe(2);
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });
  });
});
