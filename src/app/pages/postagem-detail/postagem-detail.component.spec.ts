import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ComentariosDaPostagemComponent } from '../../components/comentarios-da-postagem/comentarios-da-postagem.component';
import { ActivatedRoute, ParamMap, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, Subject, of, throwError } from 'rxjs';
import { Pagina } from '../../models/Pagina';
import { ComentarioPostagem } from '../../models/ComentarioPostagem';
import { Postagem } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { ComentarioPostagemService } from '../../services/comentario-postagem.service';
import { FonteService } from '../../services/fonte.service';
import { PerfilService } from '../../services/perfil.service';
import { PostagemService } from '../../services/postagem.service';
import { PostagemDetailComponent } from './postagem-detail.component';

describe('PostagemDetailComponent', () => {
  let fixture: ComponentFixture<PostagemDetailComponent>;
  let el: HTMLElement;
  let service: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;
  let fontes: jasmine.SpyObj<FonteService>;
  let comentarios: jasmine.SpyObj<ComentarioPostagemService>;
  let perfis: jasmine.SpyObj<PerfilService>;
  let router: Router;
  // a rota é um objeto simples; o id da postagem é um fluxo, como na rota de verdade (pode mudar sem recriar a tela)
  let params: BehaviorSubject<ParamMap>;

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
    params.next(convertToParamMap({ id }));
    fixture = TestBed.createComponent(PostagemDetailComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  beforeEach(() => {
    params = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    service = jasmine.createSpyObj('PostagemService', ['getById', 'delete', 'getPagina', 'registrarVisita']);
    service.registrarVisita.and.returnValue(of({ visitas: 1234 }));
    service.getPagina.and.returnValue(of({ conteudo: [], pagina: 0, tamanho: 50, totalElementos: 0, totalPaginas: 0, ultima: true }));
    perfis = jasmine.createSpyObj('PerfilService', ['getPerfil', 'getArquivo']);
    perfis.getArquivo.and.returnValue(of([{ ano: 2026, mes: 10, total: 4 }, { ano: 2026, mes: 8, total: 1 }]));
    perfis.getPerfil.and.returnValue(of({ id: 3, nome: 'Bia Souza', bio: 'Escrevo à mão.', totalPostagens: 12 }));
    auth = jasmine.createSpyObj('AuthService', ['getUsuario', 'isLoggedIn']);
    auth.isLoggedIn.and.returnValue(false);
    comentarios = jasmine.createSpyObj('ComentarioPostagemService', ['listar', 'comentar', 'excluir']);
    const vazia: Pagina<ComentarioPostagem> = { conteudo: [], pagina: 0, tamanho: 20, totalElementos: 0, totalPaginas: 0, ultima: true };
    comentarios.listar.and.returnValue(of(vazia));
    fontes = jasmine.createSpyObj('FonteService', ['carregar', 'carregarTodas']);
    auth.getUsuario.and.returnValue(null);
    TestBed.configureTestingModule({
      imports: [PostagemDetailComponent],
      providers: [
        provideRouter([]),
        { provide: PostagemService, useValue: service },
        { provide: AuthService, useValue: auth },
        { provide: ComentarioPostagemService, useValue: comentarios },
        { provide: PerfilService, useValue: perfis },
        { provide: FonteService, useValue: fontes },
        { provide: ActivatedRoute, useValue: { paramMap: params } }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('mostra os comentários da postagem embaixo do texto', () => {
    abrir('7');

    expect(el.querySelector('app-comentarios-da-postagem #comentarios')).not.toBeNull();
    expect(comentarios.listar).toHaveBeenCalledWith(7, 0);
  });

  it('mostra o blog completo: título, autor com link para o perfil, data, tema e texto', () => {
    abrir('7');

    expect(el.querySelector('.detalhe-titulo')!.textContent).toBe('Meu blog');
    expect(el.querySelector('.detalhe-nome')!.textContent).toBe('Bia');
    expect(el.querySelector('.detalhe-nome')!.getAttribute('href')).toBe('/perfil/3');
    expect(el.querySelector('.detalhe-assinatura')!.textContent!.replace(/\s+/g, ' ').trim()).toBe('postado por Bia às 15:30 em #Tecnologia');
    expect(el.querySelector('.detalhe-tema')!.textContent).toBe('#Tecnologia');
    expect(el.querySelector('.detalhe-rodape')!.textContent).toContain('1 min de leitura');
    expect(el.querySelector('.detalhe-texto')!.textContent).toBe('Linha 1\nLinha 2 do texto completo');
  });

  describe('estilo de blog antigo', () => {
    it('o cabeçalho tem a etiqueta de calendário com mês, dia e ano', () => {
      abrir('7');

      const calendario = el.querySelector('.calendario')!;
      expect(calendario.querySelector('.calendario-mes')!.textContent).toBe('OUT');
      expect(calendario.querySelector('.calendario-dia')!.textContent).toBe('09');
      expect(calendario.querySelector('.calendario-ano')!.textContent).toBe('2026');
    });

    it('o rodapé conta os recados do livro de visitas e leva até eles', () => {
      abrir('7', of(blog({ comentarios: 3 })));

      const link = el.querySelector<HTMLAnchorElement>('.detalhe-recados')!;
      expect(link.textContent).toBe('3 recados no livro de visitas');
      expect(link.getAttribute('href')).toContain('#comentarios');
    });

    it('sem recados e com um só, o texto muda', () => {
      abrir('7', of(blog({ comentarios: 0 })));
      expect(el.querySelector('.detalhe-recados')!.textContent).toBe('nenhum recado no livro de visitas');

      abrir('7', of(blog({ comentarios: 1 })));
      expect(el.querySelector('.detalhe-recados')!.textContent).toBe('1 recado no livro de visitas');
    });

    it('quando alguém assina ou apaga um recado, o número do rodapé acompanha', () => {
      abrir('7', of(blog({ comentarios: 3 })));

      fixture.debugElement.query(By.directive(ComentariosDaPostagemComponent)).componentInstance.totalMudou.emit(4);
      fixture.detectChanges();

      expect(el.querySelector('.detalhe-recados')!.textContent).toBe('4 recados no livro de visitas');
    });

    it('o livro de visitas fica numa folha própria, fora do post, e a barra lateral é uma coluna à parte', () => {
      abrir('7');

      expect(el.querySelector('.leitura-principal > .detalhe')).not.toBeNull();
      expect(el.querySelector('.leitura-principal > app-comentarios-da-postagem')).not.toBeNull();
      expect(el.querySelector('.leitura > app-barra-lateral-leitura')).not.toBeNull();
    });

    it('rabisco não mostra tempo de leitura no rodapé', () => {
      abrir('9', of(blog({ id: 9, tipo: 'COMENTARIO', titulo: null, tema: null, texto: 'Só um rabisco' })));

      expect(el.querySelector('.detalhe-rodape')!.textContent).not.toContain('min de leitura');
    });

    describe('copiar link', () => {
      it('copia o endereço da postagem (sem o #comentarios) e avisa que copiou', fakeAsync(() => {
        const escrever = jasmine.createSpy('writeText').and.resolveTo();
        spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText: escrever } as unknown as Clipboard);
        abrir('7');

        el.querySelector<HTMLButtonElement>('.detalhe-copiar')!.click();
        tick();
        fixture.detectChanges();

        expect(escrever).toHaveBeenCalledWith(`${window.location.origin}/postagens/7`);
        expect(el.querySelector('.detalhe-copiar')!.textContent).toContain('link copiado');

        tick(2500);
        fixture.detectChanges();
        expect(el.querySelector('.detalhe-copiar')!.textContent).toContain('copiar link');
      }));

      it('sem permissão para copiar, nada quebra', fakeAsync(() => {
        spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText: () => Promise.reject(new Error('negado')) } as unknown as Clipboard);
        abrir('7');

        el.querySelector<HTMLButtonElement>('.detalhe-copiar')!.click();
        tick();
        fixture.detectChanges();

        expect(el.querySelector('.detalhe-copiar')!.textContent).toContain('copiar link');
      }));
    });

    describe('barra lateral e anterior/próxima', () => {
      const deBia = (id: number, titulo: string): Postagem => ({ id, tipo: 'BLOG', titulo, texto: 'texto', data: '2026-10-01T10:00:00', usuario: { id: 3, nome: 'Bia' } });

      const lista = (...posts: Postagem[]) =>
        service.getPagina.and.returnValue(of({ conteudo: posts, pagina: 0, tamanho: 50, totalElementos: posts.length, totalPaginas: 1, ultima: true }));

      it('pede o perfil e as postagens recentes da autora', () => {
        abrir('7');

        expect(perfis.getPerfil).toHaveBeenCalledWith(3);
        expect(service.getPagina).toHaveBeenCalledWith({ autor: 3, size: 50 });
      });

      it('mostra o cartão da autora com os dados do perfil', () => {
        abrir('7');

        expect(el.querySelector('app-barra-lateral-leitura .autora-nome')!.textContent).toBe('Bia Souza');
        expect(el.querySelector('app-barra-lateral-leitura .autora-bio')!.textContent).toBe('Escrevo à mão.');
        expect(el.querySelector('app-barra-lateral-leitura .autora-numeros')!.textContent).toContain('12');
      });

      it('mostra os botões de anterior (mais antiga) e próxima (mais nova) da mesma autora', () => {
        lista(deBia(9, 'Mais nova'), blog({ id: 7 }), deBia(5, 'Mais antiga'));
        abrir('7');

        const anterior = el.querySelector<HTMLAnchorElement>('.navegar.anterior')!;
        const proxima = el.querySelector<HTMLAnchorElement>('.navegar.proxima')!;
        expect(anterior.getAttribute('href')).toBe('/postagens/5');
        expect(anterior.textContent).toContain('Mais antiga');
        expect(proxima.getAttribute('href')).toBe('/postagens/9');
        expect(proxima.textContent).toContain('Mais nova');
      });

      it('a postagem mais nova só tem o botão de anterior', () => {
        lista(blog({ id: 7 }), deBia(5, 'Mais antiga'));
        abrir('7');

        expect(el.querySelector('.navegar.anterior')).not.toBeNull();
        expect(el.querySelector('.navegar.proxima')).toBeNull();
      });

      it('sem vizinhas (única postagem ou fora da lista), a navegação nem aparece', () => {
        abrir('7');

        expect(el.querySelector('.detalhe-navegacao')).toBeNull();
      });

      it('se o perfil e a lista falharem, a leitura segue normal, só com o cartão básico da autora', () => {
        perfis.getPerfil.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
        service.getPagina.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
        abrir('7');

        expect(el.querySelector('.detalhe-titulo')!.textContent).toBe('Meu blog');
        expect(el.querySelector('app-barra-lateral-leitura .autora-nome')!.textContent).toBe('Bia');
        expect(el.querySelector('.detalhe-navegacao')).toBeNull();
        expect(el.querySelector('app-barra-lateral-leitura .autora-numeros')).toBeNull();
      });
    });
  });

  describe('etapa 2: visitas, arquivo e humor do dia', () => {
    it('conta a visita ao abrir e mostra o contador de visor com o total', () => {
      abrir('7');

      expect(service.registrarVisita).toHaveBeenCalledOnceWith(7);
      const digitos = Array.from(el.querySelectorAll('app-barra-lateral-leitura .digito')).map(d => d.textContent);
      expect(digitos).toEqual(['0', '0', '1', '2', '3', '4']);
    });

    it('se a contagem falhar, usa o número que veio com a postagem; sem ele, a caixa nem aparece', () => {
      service.registrarVisita.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      abrir('7', of(blog({ visitas: 42 })));
      expect(Array.from(el.querySelectorAll('.digito')).map(d => d.textContent).join('')).toBe('000042');

      abrir('7');
      expect(el.querySelector('app-barra-lateral-leitura .contador')).toBeNull();
    });

    it('o arquivo lista os meses com a quantidade e leva ao perfil filtrado', () => {
      abrir('7');

      const itens = Array.from(el.querySelectorAll('app-barra-lateral-leitura .arquivo li'));
      expect(itens.map(i => `${i.querySelector('a')!.textContent} (${i.querySelector('.arquivo-total')!.textContent})`)).toEqual([
        'outubro 2026 (4)',
        'agosto 2026 (1)'
      ]);
      expect(itens[0].querySelector('a')!.getAttribute('href')).toBe('/perfil/3?mes=2026-10');
    });

    it('se o arquivo falhar, a caixa não aparece e o resto segue', () => {
      perfis.getArquivo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      abrir('7');

      expect(el.querySelector('app-barra-lateral-leitura .arquivo')).toBeNull();
      expect(el.querySelector('.detalhe-titulo')!.textContent).toBe('Meu blog');
    });

    it('o humor do dia da autora aparece na barra lateral', () => {
      perfis.getPerfil.and.returnValue(of({ id: 3, nome: 'Bia Souza', totalPostagens: 12, humor: 'sonolenta, mas feliz' }));
      abrir('7');

      expect(el.querySelector('app-barra-lateral-leitura .humor')!.textContent).toContain('sonolenta, mas feliz');
    });
  });

  describe('post-its', () => {
    const comPostits = (lado: 'ESQUERDA' | 'DIREITA' | null) =>
      blog({ ladoDosPostits: lado, postits: [{ tipo: 'NOTA', texto: 'Lembrar do café', cor: 'AMARELO' }, { tipo: 'FOTO', fotoUrl: 'https://res.cloudinary.com/x/a.jpg', cor: 'ROSA' }] });

    it('mostra os post-its ao lado do texto, do lado que a autora escolheu', () => {
      abrir('7', of(comPostits('ESQUERDA')));

      const corpo = el.querySelector('.detalhe-corpo')!;
      expect(corpo.classList).toContain('com-postits');
      expect(corpo.classList).toContain('postits-esquerda');
      expect(corpo.querySelectorAll('app-postits-da-leitura .postit').length).toBe(2);
      expect(corpo.querySelector('.detalhe-texto')).not.toBeNull();
    });

    it('do lado direito (o padrão), não leva a classe do lado esquerdo', () => {
      abrir('7', of(comPostits('DIREITA')));

      expect(el.querySelector('.detalhe-corpo')!.classList).toContain('com-postits');
      expect(el.querySelector('.detalhe-corpo')!.classList).not.toContain('postits-esquerda');
    });

    it('sem post-its, o texto ocupa a largura toda e nada de post-its é desenhado', () => {
      abrir('7');

      expect(el.querySelector('.detalhe-corpo')!.classList).not.toContain('com-postits');
      expect(el.querySelector('app-postits-da-leitura')).toBeNull();
    });
  });

  describe('navegar entre postagens (anterior, próxima e "mais da autora")', () => {
    const outra = (id: number, titulo: string): Postagem => blog({ id, titulo, texto: 'Texto de ' + titulo });

    it('mudar o id do endereço abre a outra postagem na mesma tela', () => {
      abrir('7');
      expect(el.querySelector('.detalhe-titulo')!.textContent).toBe('Meu blog');
      service.getById.and.returnValue(of(outra(5, 'A anterior')));

      params.next(convertToParamMap({ id: '5' }));
      fixture.detectChanges();

      expect(service.getById).toHaveBeenCalledWith(5);
      expect(el.querySelector('.detalhe-titulo')!.textContent).toBe('A anterior');
      expect(el.querySelector('.detalhe-texto')!.textContent).toBe('Texto de A anterior');
    });

    it('o que era da postagem anterior some: curtidas, livro de visitas, contador e vizinhas são pedidos de novo', () => {
      abrir('7');
      comentarios.listar.calls.reset();
      service.registrarVisita.calls.reset();
      perfis.getPerfil.calls.reset();
      service.getById.and.returnValue(of(outra(5, 'A anterior')));

      params.next(convertToParamMap({ id: '5' }));
      fixture.detectChanges();

      expect(comentarios.listar).toHaveBeenCalledWith(5, 0);
      expect(service.registrarVisita).toHaveBeenCalledWith(5);
      expect(perfis.getPerfil).toHaveBeenCalledTimes(1);
      expect(service.getPagina).toHaveBeenCalled();
    });

    it('enquanto a outra carrega, mostra "Carregando..." em vez da postagem antiga', () => {
      abrir('7');
      const resposta = new Subject<Postagem>();
      service.getById.and.returnValue(resposta);

      params.next(convertToParamMap({ id: '5' }));
      fixture.detectChanges();

      expect(el.querySelector('.detalhe-titulo')).toBeNull();
      expect(el.querySelector('.detalhe-aviso')!.textContent).toContain('Carregando');
    });

    it('uma resposta atrasada da postagem anterior não sobrescreve a que está na tela', () => {
      const lenta = new Subject<Postagem>();
      service.getById.and.returnValue(lenta);
      rotaInicial('7');
      service.getById.and.returnValue(of(outra(5, 'A que está na tela')));
      params.next(convertToParamMap({ id: '5' }));
      fixture.detectChanges();

      lenta.next(outra(7, 'Resposta velha'));
      fixture.detectChanges();

      expect(el.querySelector('.detalhe-titulo')!.textContent).toBe('A que está na tela');
    });

    it('id inválido no endereço volta ao mural, mesmo depois de abrir outra postagem', () => {
      abrir('7');

      params.next(convertToParamMap({ id: 'abc' }));

      expect(router.navigate).toHaveBeenCalledWith(['/explorar']);
    });

    function rotaInicial(id: string): void {
      params.next(convertToParamMap({ id }));
      fixture = TestBed.createComponent(PostagemDetailComponent);
      fixture.detectChanges();
      el = fixture.nativeElement;
    }
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

  it('postagem inexistente mostra o aviso e o caminho de volta', () => {
    auth.isLoggedIn.and.returnValue(true);
    abrir('999', throwError(() => new HttpErrorResponse({ status: 404 })));

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.querySelector('.detalhe-voltar')!.getAttribute('href')).toBe('/explorar');
  });

  describe('voltar: quem tem conta volta ao mural, visitante volta ao início', () => {
    it('logado: "Voltar ao mural", que leva ao mural', () => {
      auth.isLoggedIn.and.returnValue(true);
      abrir('7');

      const voltar = el.querySelector<HTMLAnchorElement>('.detalhe-voltar')!;
      expect(voltar.getAttribute('href')).toBe('/explorar');
      expect(voltar.textContent).toContain('Voltar ao mural');
    });

    it('visitante: "Voltar ao início", que NUNCA leva ao mural completo (a prévia da home é o limite dele)', () => {
      auth.isLoggedIn.and.returnValue(false);
      abrir('7');

      const voltar = el.querySelector<HTMLAnchorElement>('.detalhe-voltar')!;
      expect(voltar.getAttribute('href')).toBe('/');
      expect(voltar.textContent).toContain('Voltar ao início');
      expect(el.querySelector('a[href="/explorar"]')).toBeNull();
    });
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

    const modal = () => el.querySelector<HTMLDialogElement>('.leitura > app-confirmar-exclusao dialog')!;
    const confirmar = () => el.querySelector<HTMLButtonElement>('.leitura > app-confirmar-exclusao .zine-botao.perigo')!;
    const cancelar = () => el.querySelector<HTMLButtonElement>('.leitura > app-confirmar-exclusao .modal-rodape .zine-botao:not(.perigo)')!;
    const clicarExcluir = () => {
      el.querySelectorAll<HTMLButtonElement>('.detalhe-acoes button')[1].click();
      fixture.detectChanges();
    };

    it('Excluir abre o modal de confirmação e ainda não apaga nada', () => {
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      clicarExcluir();

      expect(modal().open).toBeTrue();
      expect(service.delete).not.toHaveBeenCalled();
    });

    it('confirmar apaga e volta para Minhas postagens', () => {
      service.delete.and.returnValue(of(undefined));
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      clicarExcluir();
      confirmar().click();
      fixture.detectChanges();

      expect(service.delete).toHaveBeenCalledOnceWith(7);
      expect(router.navigate).toHaveBeenCalledWith(['/postagens']);
      expect(modal().open).toBeFalse();
    });

    it('cancelar fecha o modal e nada é apagado', () => {
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      clicarExcluir();
      cancelar().click();
      fixture.detectChanges();

      expect(modal().open).toBeFalse();
      expect(service.delete).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('a postagem continua na tela enquanto a exclusão acontece (o modal mostra "Excluindo...")', () => {
      const resposta = new Subject<void>();
      service.delete.and.returnValue(resposta);
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      clicarExcluir();
      confirmar().click();
      fixture.detectChanges();

      expect(el.querySelector('.detalhe-titulo')).not.toBeNull();
      expect(confirmar().textContent!.trim()).toBe('Excluindo...');
      expect(confirmar().disabled).toBeTrue();
    });

    it('se a API recusar, o modal fecha e o erro aparece, com a postagem ainda na tela', () => {
      service.delete.and.returnValue(throwError(() => new Error('falhou')));
      auth.getUsuario.and.returnValue({ id: 3 });
      abrir('7');

      clicarExcluir();
      confirmar().click();
      fixture.detectChanges();

      expect(modal().open).toBeFalse();
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('Erro ao excluir postagem');
      expect(el.querySelector('.detalhe-titulo')).not.toBeNull();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
