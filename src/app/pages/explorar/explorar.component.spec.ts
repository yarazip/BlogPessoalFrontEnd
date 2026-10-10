import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { PostagemService } from '../../services/postagem.service';
import { Pagina } from '../../models/Pagina';
import { Postagem } from '../../models/Postagem';
import { OBSERVADOR_DE_INTERSECAO } from '../../shared/sentinela/sentinela.directive';
import { ExplorarComponent } from './explorar.component';

/** Observador falso: o teste decide quando "o usuário rolou até o fim da lista". */
class ObservadorFalso {
  static instancias: ObservadorFalso[] = [];

  constructor(private readonly aoObservar: IntersectionObserverCallback) {
    ObservadorFalso.instancias.push(this);
  }

  observe(): void {
    /* o teste dispara a rolagem manualmente, via rolarAteOFim() */
  }

  disconnect(): void {
    /* nada a liberar no falso */
  }

  rolarAteOFim(): void {
    this.aoObservar([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

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
    ObservadorFalso.instancias = [];
    service = jasmine.createSpyObj('PostagemService', ['getPagina']);
    TestBed.configureTestingModule({
      imports: [ExplorarComponent],
      providers: [
        { provide: PostagemService, useValue: service },
        { provide: OBSERVADOR_DE_INTERSECAO, useValue: ObservadorFalso as unknown as typeof IntersectionObserver }
      ]
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

  it('mostra o autor, o título, o texto e o tema (sem as aspas antigas do banco)', () => {
    const el = criar(of(pagina([{ ...postagem('texto da postagem'), tema: { id: 1, descricao: "'Tecnologia'" } }], 0, true)));

    expect(el.querySelector('.autor')!.textContent).toBe('Ana');
    expect(el.querySelector('.post-titulo')!.textContent).toBe('Título 1');
    expect(el.querySelector('.post-tema')!.textContent).toBe('#Tecnologia');
  });

  describe('rolagem infinita', () => {
    const rolarAteOFim = () => {
      ObservadorFalso.instancias[ObservadorFalso.instancias.length - 1].rolarAteOFim();
      fixture.detectChanges();
    };
    const titulos = () =>
      Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('article h3')).map(h => h.textContent);

    it('pede a primeira página com o tamanho padrão', () => {
      criar(of(pagina([postagem('a')], 0, true)));

      expect(service.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10 });
    });

    it('só observa o fim da lista enquanto houver mais páginas', () => {
      criar(of(pagina([postagem('a')], 0, false)));
      expect(ObservadorFalso.instancias.length).toBe(1);

      TestBed.resetTestingModule();
      ObservadorFalso.instancias = [];
      TestBed.configureTestingModule({
        imports: [ExplorarComponent],
        providers: [
          { provide: PostagemService, useValue: service },
          { provide: OBSERVADOR_DE_INTERSECAO, useValue: ObservadorFalso as unknown as typeof IntersectionObserver }
        ]
      });
      criar(of(pagina([postagem('a')], 0, true)));
      expect(ObservadorFalso.instancias.length).toBe(0);
    });

    it('ao rolar até o fim, acrescenta a próxima página sem repetir nem perder itens', () => {
      service.getPagina.and.returnValues(
        of(pagina([postagem('um', 1), postagem('dois', 2)], 0, false)),
        of(pagina([postagem('três', 3)], 1, true))
      );
      fixture = TestBed.createComponent(ExplorarComponent);
      fixture.detectChanges();

      rolarAteOFim();

      expect(service.getPagina.calls.allArgs()).toEqual([[{ page: 0, size: 10 }], [{ page: 1, size: 10 }]]);
      expect(titulos()).toEqual(['Título 1', 'Título 2', 'Título 3']);
      expect(ObservadorFalso.instancias.length).toBe(1); // a última página some com o observador
    });

    it('um erro ao carregar mais mantém o que já estava na tela e permite tentar de novo', () => {
      service.getPagina.and.returnValues(
        of(pagina([postagem('um', 1)], 0, false)),
        throwError(() => new Error('falhou')),
        of(pagina([postagem('dois', 2)], 1, true))
      );
      fixture = TestBed.createComponent(ExplorarComponent);
      fixture.detectChanges();

      rolarAteOFim();

      const el = fixture.nativeElement as HTMLElement;
      expect(titulos()).toEqual(['Título 1']);
      expect(el.querySelector('[role="alert"]')).not.toBeNull();

      el.querySelector<HTMLButtonElement>('.feed-tentar')!.click();
      fixture.detectChanges();

      expect(titulos()).toEqual(['Título 1', 'Título 2']);
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    it('depois de um erro, rolar de novo não repete a busca sozinho', () => {
      service.getPagina.and.returnValues(
        of(pagina([postagem('um', 1)], 0, false)),
        throwError(() => new Error('falhou'))
      );
      fixture = TestBed.createComponent(ExplorarComponent);
      fixture.detectChanges();
      rolarAteOFim();

      fixture.componentInstance.carregarMais();

      expect(service.getPagina).toHaveBeenCalledTimes(2);
    });
  });
});
