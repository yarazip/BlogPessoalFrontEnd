import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { FonteService } from '../../services/fonte.service';
import { PostagemService } from '../../services/postagem.service';
import { Pagina } from '../../models/Pagina';
import { Postagem } from '../../models/Postagem';
import { OBSERVADOR_DE_INTERSECAO } from '../../shared/sentinela/sentinela.directive';
import { FeedPostagensComponent } from './feed-postagens.component';

@Component({
  standalone: true,
  imports: [FeedPostagensComponent],
  template: '<app-feed-postagens><header class="cabecalho-projetado">Perfil</header></app-feed-postagens>'
})
class AnfitriaoComCabecalhoComponent {}

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

describe('FeedPostagensComponent', () => {
  const roteador = provideRouter([]);
  let fixture: ComponentFixture<FeedPostagensComponent>;
  let service: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;
  let fontes: jasmine.SpyObj<FonteService>;

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
    fixture = TestBed.createComponent(FeedPostagensComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    ObservadorFalso.instancias = [];
    service = jasmine.createSpyObj('PostagemService', ['getPagina', 'delete']);
    auth = jasmine.createSpyObj('AuthService', ['getUsuario']);
    fontes = jasmine.createSpyObj('FonteService', ['carregar', 'carregarTodas']);
    auth.getUsuario.and.returnValue(null);
    TestBed.configureTestingModule({
      imports: [FeedPostagensComponent],
      providers: [
        roteador,
        { provide: PostagemService, useValue: service },
        { provide: AuthService, useValue: auth },
        { provide: FonteService, useValue: fontes },
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

  describe('tempo de leitura', () => {
    const longo = Array(450).fill('palavra').join(' ');
    const leitura = (el: HTMLElement) => el.querySelector('.leitura')?.textContent?.trim() ?? null;

    it('rascunho com o texto inteiro mostra os minutos calculados', () => {
      expect(leitura(criar(of(pagina([postagem(longo)], 0, true))))).toBe('· 3 min de leitura');
    });

    it('prévia usa o tempo calculado pela API (o texto da lista vem cortado)', () => {
      const previa = { ...postagem('começo do texto'), resumido: true, minutosLeitura: 7 };

      expect(leitura(criar(of(pagina([previa], 0, true))))).toBe('· 7 min de leitura');
    });

    it('prévia sem o dado da API não mostra um número errado', () => {
      const previa = { ...postagem('começo do texto'), resumido: true };

      expect(leitura(criar(of(pagina([previa], 0, true))))).toBeNull();
    });

    it('rabisco não mostra tempo de leitura', () => {
      const rabisco: Postagem = { ...postagem(longo), tipo: 'COMENTARIO' };

      expect(leitura(criar(of(pagina([rabisco], 0, true))))).toBeNull();
    });
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

  it('o nome e a foto do autor levam ao perfil dele', () => {
    const el = criar(of(pagina([postagem('texto', 1)], 0, true)));

    expect(el.querySelector('.autor a')!.getAttribute('href')).toBe('/perfil/1');
    expect(el.querySelector('.foto-link')!.getAttribute('href')).toBe('/perfil/1');
    expect(el.querySelector('.foto-link')!.getAttribute('aria-label')).toBe('Perfil de Ana');
  });

  describe('tipos de postagem', () => {
    const comentario = (texto: string, id = 1): Postagem => ({ id, tipo: 'COMENTARIO', texto, data: '2024-01-10T15:30:00Z', usuario: { id: 1, nome: 'Ana' } });
    const blog = (id = 2, extra: Partial<Postagem> = {}): Postagem => ({
      id, tipo: 'BLOG', titulo: 'Título do blog', texto: 'Prévia do texto', data: '2024-01-10T15:30:00Z', usuario: { id: 1, nome: 'Ana' }, ...extra
    });

    it('comentário aparece só com o texto: sem título e sem "Ler mais"', () => {
      const el = criar(of(pagina([comentario('Um comentário curto')], 0, true)));

      expect(el.querySelector('.post-titulo')).toBeNull();
      expect(el.querySelector('.ler-mais')).toBeNull();
      expect(el.querySelector('.texto-postagem')!.textContent).toBe('Um comentário curto');
    });

    it('blog tem o título como link para a leitura completa', () => {
      const el = criar(of(pagina([blog(7)], 0, true)));

      expect(el.querySelector('.post-titulo a')!.getAttribute('href')).toBe('/postagens/7');
      expect(el.querySelector('.ler-mais')).toBeNull();
      expect(el.querySelector('.texto-postagem.resumido')).toBeNull();
    });

    it('blog resumido mostra reticências e o link "Ler mais" para a postagem', () => {
      const el = criar(of(pagina([blog(7, { resumido: true })], 0, true)));

      expect(el.querySelector('.texto-postagem')!.classList).toContain('resumido');
      expect(el.querySelector('.ler-mais')!.getAttribute('href')).toBe('/postagens/7');
      expect(el.querySelector('.ler-mais')!.textContent).toContain('Ler mais');
    });

    it('postagem sem tipo (resposta antiga da API) é tratada como blog: o título aparece', () => {
      const el = criar(of(pagina([postagem('texto antigo', 3)], 0, true)));

      expect(el.querySelector('.post-titulo')!.textContent).toBe('Título 3');
    });

    it('adicionarNoTopo coloca a postagem nova antes das que já estavam', () => {
      criar(of(pagina([comentario('antigo', 1)], 0, true)));

      fixture.componentInstance.adicionarNoTopo(comentario('novinho', 9));
      fixture.detectChanges();

      const textos = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.texto-postagem')).map(t => t.textContent);
      expect(textos).toEqual(['novinho', 'antigo']);
    });
  });

  describe('fonte do rascunho', () => {
    const blogCom = (fonte: Postagem['fonte'], id = 5): Postagem => ({
      id, tipo: 'BLOG', titulo: 'Título do rascunho', texto: 'Texto do rascunho', fonte, usuario: { id: 1, nome: 'Ana' }
    });
    const titulo = (el: HTMLElement) => el.querySelector('.post-titulo') as HTMLElement;
    const texto = (el: HTMLElement) => el.querySelector('.texto-postagem') as HTMLElement;

    it('o título e o texto aparecem na fonte escolhida pela autora', () => {
      const el = criar(of(pagina([blogCom('MEA_CULPA')], 0, true)));

      expect(titulo(el).style.fontFamily).toContain('Mea Culpa');
      expect(texto(el).style.fontFamily).toContain('Mea Culpa');
    });

    it('fontes de peso único mostram o título sem negrito sintetizado; a Fraunces usa o negrito de verdade', () => {
      expect(titulo(criar(of(pagina([blogCom('RYE')], 0, true)))).style.fontWeight).toBe('400');
      expect(titulo(criar(of(pagina([blogCom('FRAUNCES', 6)], 0, true)))).style.fontWeight).toBe('700');
    });

    it('sem fonte escolhida, nenhum estilo é aplicado e vale o visual padrão do site', () => {
      const el = criar(of(pagina([blogCom(null)], 0, true)));

      expect(titulo(el).style.fontFamily).toBe('');
      expect(titulo(el).style.fontWeight).toBe('');
      expect(texto(el).style.fontFamily).toBe('');
    });

    it('pede ao serviço cada fonte usada na página', () => {
      criar(of(pagina([blogCom('RYE', 1), blogCom('FRAUNCES', 2), blogCom(null, 3)], 0, true)));

      expect(fontes.carregar.calls.allArgs()).toEqual([['RYE'], ['FRAUNCES'], [null]]);
    });
  });

  describe('curtir e descurtir', () => {
    const comReacoes = (extra: Partial<Postagem>): Postagem => ({ id: 4, tipo: 'COMENTARIO', texto: 'com reações', usuario: { id: 2, nome: 'Bia' }, ...extra });

    it('cada postagem mostra os botões com os totais, inclusive o de descurtidas', () => {
      const el = criar(of(pagina([comReacoes({ curtidas: 12, descurtidas: 3, minhaReacao: 'CURTIDA' })], 0, true)));

      const numeros = Array.from(el.querySelectorAll('app-reacoes .contagem')).map(n => n.textContent);
      expect(numeros).toEqual(['12', '3']);
      expect(el.querySelector('.reacao-curtir')!.classList).toContain('ativa');
    });

    it('resposta antiga da API, sem os campos novos, conta como zero', () => {
      const el = criar(of(pagina([comReacoes({})], 0, true)));

      const numeros = Array.from(el.querySelectorAll('app-reacoes .contagem')).map(n => n.textContent);
      expect(numeros).toEqual(['0', '0']);
    });
  });

  describe('menu de três pontinhos (editar e excluir)', () => {
    const minha = (id: number): Postagem => ({ id, tipo: 'COMENTARIO', texto: 'minha ' + id, usuario: { id: 5, nome: 'Eu' } });
    const deOutra = (id: number): Postagem => ({ id, tipo: 'COMENTARIO', texto: 'dela ' + id, usuario: { id: 6, nome: 'Outra' } });

    const abrir = (posts: Postagem[], logada = true) => {
      auth.getUsuario.and.returnValue(logada ? { id: 5 } : null);
      service.getPagina.and.returnValue(of(pagina(posts, 0, true)));
      fixture = TestBed.createComponent(FeedPostagensComponent);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };
    const abrirMenu = (el: HTMLElement, indice = 0) => {
      el.querySelectorAll<HTMLButtonElement>('.menu-botao')[indice].click();
      fixture.detectChanges();
    };
    const itensDoMenu = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>('.menu-item'));

    it('as minhas postagens têm o menu, em qualquer feed; as das outras pessoas não', () => {
      const el = abrir([minha(1), deOutra(2)]);

      expect(el.querySelectorAll('app-menu-postagem').length).toBe(1);
      expect(el.querySelectorAll('article')[0].querySelector('app-menu-postagem')).not.toBeNull();
      expect(el.querySelectorAll('article')[1].querySelector('app-menu-postagem')).toBeNull();
    });

    it('visitante não vê o menu em nenhuma postagem', () => {
      expect(abrir([minha(1), deOutra(2)], false).querySelector('app-menu-postagem')).toBeNull();
    });

    it('os links soltos de Editar e Excluir deixaram de existir', () => {
      expect(abrir([minha(1)]).querySelector('.post-acoes')).toBeNull();
    });

    it('o menu abre com Editar (para o formulário da postagem) e Excluir', () => {
      const el = abrir([minha(1)]);

      abrirMenu(el);

      expect(itensDoMenu(el).map(i => i.textContent!.trim())).toEqual(['Editar', 'Excluir']);
      expect(itensDoMenu(el)[0].getAttribute('href')).toBe('/postagens/1/editar');
    });

    it('o botão do menu diz de qual postagem é', () => {
      const el = abrir([{ ...minha(1), tipo: 'BLOG', titulo: 'Meu título' }]);

      expect(el.querySelector('.menu-botao')!.getAttribute('aria-label')).toBe('Opções da postagem: Meu título');
    });

    it('o cabeçalho das minhas postagens ganha folga para o botão', () => {
      const el = abrir([minha(1), deOutra(2)]);

      const cabecalhos = el.querySelectorAll('.post-cabecalho');
      expect(cabecalhos[0].classList).toContain('com-menu');
      expect(cabecalhos[1].classList).not.toContain('com-menu');
    });

    /** Abre o menu da primeira postagem e clica em "Excluir": só abre o modal de confirmação. */
    const pedirExclusao = (el: HTMLElement, indice = 0) => {
      abrirMenu(el, indice);
      itensDoMenu(el)[1].click();
      fixture.detectChanges();
    };
    const modal = (el: HTMLElement) => el.querySelector<HTMLDialogElement>('app-confirmar-exclusao dialog')!;
    const botaoConfirmar = (el: HTMLElement) => el.querySelector<HTMLButtonElement>('app-confirmar-exclusao .zine-botao.perigo')!;
    const botaoCancelar = (el: HTMLElement) =>
      el.querySelector<HTMLButtonElement>('app-confirmar-exclusao .modal-rodape .zine-botao:not(.perigo)')!;

    it('Excluir abre o modal de confirmação e ainda não apaga nada', () => {
      const el = abrir([minha(1)]);

      pedirExclusao(el);

      expect(modal(el).open).toBeTrue();
      expect(el.querySelector('app-confirmar-exclusao .modal-titulo')!.textContent).toBe('Excluir esta postagem?');
      expect(service.delete).not.toHaveBeenCalled();
      expect(el.querySelectorAll('article').length).toBe(1);
    });

    it('confirmar apaga na API, tira da lista, avisa quem usa e fecha o modal', () => {
      service.delete.and.returnValue(of(undefined));
      const el = abrir([minha(1), minha(2)]);
      const removidas: Postagem[] = [];
      fixture.componentInstance.removida.subscribe(p => removidas.push(p));

      pedirExclusao(el, 0);
      botaoConfirmar(el).click();
      fixture.detectChanges();

      expect(service.delete).toHaveBeenCalledOnceWith(1);
      expect(Array.from(el.querySelectorAll('.texto-postagem')).map(t => t.textContent)).toEqual(['minha 2']);
      expect(removidas.map(p => p.id)).toEqual([1]);
      expect(modal(el).open).toBeFalse();
    });

    it('cancelar fecha o modal e nada é apagado', () => {
      const el = abrir([minha(1)]);

      pedirExclusao(el);
      botaoCancelar(el).click();
      fixture.detectChanges();

      expect(modal(el).open).toBeFalse();
      expect(service.delete).not.toHaveBeenCalled();
      expect(el.querySelectorAll('article').length).toBe(1);
    });

    it('o foco começa em "Cancelar" (a ação segura), não em "Excluir"', () => {
      const el = abrir([minha(1)]);

      pedirExclusao(el);

      expect(document.activeElement).toBe(botaoCancelar(el));
    });

    it('Esc também cancela', () => {
      const el = abrir([minha(1)]);
      pedirExclusao(el);

      modal(el).dispatchEvent(new Event('cancel', { cancelable: true }));
      fixture.detectChanges();

      expect(modal(el).open).toBeFalse();
      expect(service.delete).not.toHaveBeenCalled();
    });

    it('enquanto a API apaga, os botões ficam travados, o botão mostra "Excluindo..." e a janela não fecha', () => {
      const resposta = new Subject<void>();
      service.delete.and.returnValue(resposta);
      const el = abrir([minha(1)]);
      pedirExclusao(el);

      botaoConfirmar(el).click();
      fixture.detectChanges();

      expect(botaoConfirmar(el).disabled).toBeTrue();
      expect(botaoCancelar(el).disabled).toBeTrue();
      expect(botaoConfirmar(el).textContent!.trim()).toBe('Excluindo...');
      expect(el.querySelector('app-confirmar-exclusao .modal-x')).toBeNull();
      modal(el).dispatchEvent(new Event('cancel', { cancelable: true }));
      fixture.detectChanges();
      expect(modal(el).open).toBeTrue();

      resposta.next();
      resposta.complete();
      fixture.detectChanges();
      expect(modal(el).open).toBeFalse();
    });

    it('um segundo clique em "Excluir" durante a exclusão não manda outra chamada', () => {
      service.delete.and.returnValue(new Subject<void>());
      const el = abrir([minha(1)]);
      pedirExclusao(el);

      botaoConfirmar(el).click();
      fixture.componentInstance.confirmarExclusao();

      expect(service.delete).toHaveBeenCalledTimes(1);
    });

    it('se a API recusar, o modal fecha, a postagem continua na lista e o erro aparece', () => {
      service.delete.and.returnValue(throwError(() => new Error('falhou')));
      const el = abrir([minha(1)]);

      pedirExclusao(el);
      botaoConfirmar(el).click();
      fixture.detectChanges();

      expect(modal(el).open).toBeFalse();
      expect(el.querySelectorAll('article').length).toBe(1);
      expect(el.querySelector('.feed-erro[role="alert"]')!.textContent).toContain('Não foi possível excluir');
    });

    it('o erro de uma tentativa some quando a pessoa tenta excluir de novo', () => {
      service.delete.and.returnValue(throwError(() => new Error('falhou')));
      const el = abrir([minha(1)]);
      pedirExclusao(el);
      botaoConfirmar(el).click();
      fixture.detectChanges();
      expect(el.querySelector('.feed-erro[role="alert"]')).not.toBeNull();

      pedirExclusao(el);

      expect(el.querySelector('.feed-erro[role="alert"]')).toBeNull();
    });
  });

  describe('feed de uma pessoa (perfil)', () => {
    const criarDoAutor = (autor: number, resposta: Observable<Pagina<Postagem>>, vazia?: string) => {
      service.getPagina.and.returnValue(resposta);
      fixture = TestBed.createComponent(FeedPostagensComponent);
      fixture.componentRef.setInput('autor', autor);
      if (vazia) {
        fixture.componentRef.setInput('mensagemVazia', vazia);
      }
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    it('pede só as postagens daquela pessoa', () => {
      criarDoAutor(7, of(pagina([postagem('a')], 0, true)));

      expect(service.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10, autor: 7 });
    });

    it('sem postagens mostra a mensagem própria do perfil', () => {
      const el = criarDoAutor(7, of(pagina([], 0, true)), 'Esta pessoa ainda não publicou nada.');

      expect(el.textContent).toContain('Esta pessoa ainda não publicou nada.');
    });

    it('o conteúdo colocado dentro da tag aparece no topo da coluna', () => {
      const el = (() => {
        service.getPagina.and.returnValue(of(pagina([postagem('a')], 0, true)));
        const anfitriao = TestBed.createComponent(AnfitriaoComCabecalhoComponent);
        anfitriao.detectChanges();
        return anfitriao.nativeElement as HTMLElement;
      })();

      expect(el.querySelector('.feed > .cabecalho-projetado')).not.toBeNull();
      expect(el.querySelector('.feed')!.firstElementChild!.classList).toContain('cabecalho-projetado');
    });
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
        imports: [FeedPostagensComponent],
        providers: [
          roteador,
          { provide: PostagemService, useValue: service },
          { provide: AuthService, useValue: auth },
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
      fixture = TestBed.createComponent(FeedPostagensComponent);
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
      fixture = TestBed.createComponent(FeedPostagensComponent);
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
      fixture = TestBed.createComponent(FeedPostagensComponent);
      fixture.detectChanges();
      rolarAteOFim();

      fixture.componentInstance.carregarMais();

      expect(service.getPagina).toHaveBeenCalledTimes(2);
    });
  });
});
