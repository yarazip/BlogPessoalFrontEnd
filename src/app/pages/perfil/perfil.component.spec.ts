import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { Perfil } from '../../models/Perfil';
import { Postagem } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { PostagemService } from '../../services/postagem.service';
import { PerfilComponent } from './perfil.component';

describe('PerfilComponent (perfil e postagens numa página só)', () => {
  let fixture: ComponentFixture<PerfilComponent>;
  let el: HTMLElement;
  let perfis: jasmine.SpyObj<PerfilService>;
  let postagens: jasmine.SpyObj<PostagemService>;
  let auth: jasmine.SpyObj<AuthService>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let consulta: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const perfil = (sobre: Partial<Perfil> = {}): Perfil => ({
    id: 5,
    nome: 'Bia Autora',
    bio: 'Escrevo sobre café.',
    totalPostagens: 3,
    ...sobre
  });

  const pagina = (conteudo: Postagem[] = []) => ({
    conteudo,
    pagina: 0,
    tamanho: 10,
    totalElementos: conteudo.length,
    totalPaginas: 1,
    ultima: true
  });

  const abrir = (id: string, resposta: Observable<Perfil> = of(perfil())) => {
    perfis.getPerfil.and.returnValue(resposta);
    params.next(convertToParamMap({ id }));
    fixture = TestBed.createComponent(PerfilComponent);
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const logadoComo = (id: number, email = 'bia@exemplo.com') => {
    auth.isLoggedIn.and.returnValue(true);
    auth.getUsuario.and.returnValue({ id, email });
  };

  beforeEach(() => {
    perfis = jasmine.createSpyObj('PerfilService', ['getPerfil', 'atualizarBio', 'atualizarHumor']);
    postagens = jasmine.createSpyObj('PostagemService', ['getPagina', 'create', 'delete']);
    postagens.getPagina.and.returnValue(of(pagina()));
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getUsuario', 'atualizarFoto', 'updateUsuario']);
    auth.isLoggedIn.and.returnValue(false);
    auth.getUsuario.and.returnValue(null);
    params = new BehaviorSubject(convertToParamMap({}));
    consulta = new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [
        provideRouter([]),
        { provide: PerfilService, useValue: perfis },
        { provide: PostagemService, useValue: postagens },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { paramMap: params, queryParamMap: consulta } }
      ]
    });
  });

  describe('humor do dia', () => {
    it('mostra o humor da pessoa para quem visita, sem botão de editar', () => {
      abrir('5', of(perfil({ humor: 'sonolenta :sol:' })));

      // sem rótulo: só o humor, com o emoji da Rasura
      expect(el.querySelector('app-humor-do-dia .humor-atual')!.textContent).not.toContain('Humor do dia');
      expect(el.querySelector('app-humor-do-dia .humor-atual')!.textContent).toContain('sonolenta');
      expect(el.querySelector('app-humor-do-dia .emoji')).not.toBeNull();
      expect(el.querySelector('app-humor-do-dia .humor-botao')).toBeNull();
    });

    it('a dona escolhe um emoji da Rasura e ele vai para a frente do humor (trocando o anterior)', () => {
      logadoComo(5);
      abrir('5', of(perfil({ humor: ':lua: animada' })));
      el.querySelector<HTMLButtonElement>('app-humor-do-dia .humor-botao')!.click();
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('app-humor-do-dia .emoji-botao')!.click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('app-humor-do-dia .emoji-opcao[aria-label="Sol"]')!.click();
      fixture.detectChanges();

      expect(el.querySelector<HTMLInputElement>('#humor-do-dia')!.value).toBe(':sol: animada');
    });

    it('sem humor e sem ser a dona, não mostra nada', () => {
      abrir('5');

      expect(el.querySelector('app-humor-do-dia .humor-atual')).toBeNull();
    });

    it('a dona define o humor e a tela atualiza sem recarregar', () => {
      logadoComo(5);
      perfis.atualizarHumor.and.returnValue(of(perfil({ humor: 'animada' })));
      abrir('5');

      el.querySelector<HTMLButtonElement>('app-humor-do-dia .humor-botao')!.click();
      fixture.detectChanges();
      const campo = el.querySelector<HTMLInputElement>('#humor-do-dia')!;
      campo.value = 'animada';
      campo.dispatchEvent(new Event('input'));
      el.querySelector<HTMLButtonElement>('app-humor-do-dia button[type="submit"]')!.click();
      fixture.detectChanges();

      expect(perfis.atualizarHumor).toHaveBeenCalledWith(5, 'animada');
      expect(el.querySelector('app-humor-do-dia .humor-atual')!.textContent).toContain('animada');
    });
  });

  describe('arquivo (filtro por mês)', () => {
    it('sem ?mes=, mostra todas as postagens e a caixa de rabisco da dona', () => {
      logadoComo(5);
      abrir('5');

      expect(el.querySelector('.filtro-do-mes')).toBeNull();
      expect(postagens.getPagina.calls.mostRecent().args[0]?.mes).toBeUndefined();
      expect(el.querySelector('app-compositor-comentario')).not.toBeNull();
    });

    it('com ?mes=2026-10, só pede e mostra aquele mês, avisa e oferece ver todas', () => {
      consulta.next(convertToParamMap({ mes: '2026-10' }));
      abrir('5');

      expect(postagens.getPagina).toHaveBeenCalledWith(jasmine.objectContaining({ autor: 5, mes: '2026-10' }));
      expect(el.querySelector('.filtro-do-mes')!.textContent).toContain('outubro 2026');
      expect(el.querySelector('.filtro-do-mes a')!.getAttribute('href')).toBe('/perfil/5');
    });

    it('filtrando por mês, a caixa de rabisco não aparece (publicar ali sumiria da lista filtrada)', () => {
      logadoComo(5);
      consulta.next(convertToParamMap({ mes: '2026-10' }));
      abrir('5');

      expect(el.querySelector('app-compositor-comentario')).toBeNull();
    });

    it('mês mal escrito na barra de endereço é ignorado', () => {
      consulta.next(convertToParamMap({ mes: "2026-13'; drop" }));
      abrir('5');

      expect(el.querySelector('.filtro-do-mes')).toBeNull();
      expect(postagens.getPagina.calls.mostRecent().args[0]?.mes).toBeUndefined();
    });

    it('trocar o mês na mesma página recarrega a lista do mês novo', () => {
      abrir('5');
      postagens.getPagina.calls.reset();

      consulta.next(convertToParamMap({ mes: '2026-08' }));
      fixture.detectChanges();

      expect(postagens.getPagina).toHaveBeenCalledWith(jasmine.objectContaining({ mes: '2026-08' }));
    });
  });

  describe('visão pública', () => {
    it('mostra nome, bio e quantidade de postagens, sem e-mail nem ações de edição', () => {
      abrir('5');

      expect(el.querySelector('.perfil-nome')!.textContent).toBe('Bia Autora');
      expect(el.querySelector('.perfil-bio')!.textContent).toBe('Escrevo sobre café.');
      expect(el.querySelector('.perfil-contagem')!.textContent!.trim()).toBe('3 postagens');
      expect(el.textContent).not.toContain('@');
      expect(el.querySelector('.perfil-acoes')).toBeNull();
      expect(el.querySelector('.perfil-trocar-foto')).toBeNull();
      expect(el.querySelector('app-compositor-comentario')).toBeNull();
    });

    it('usa o singular com uma postagem e a foto padrão sem foto', () => {
      abrir('5', of(perfil({ totalPostagens: 1, foto: null })));

      expect(el.querySelector('.perfil-contagem')!.textContent!.trim()).toBe('1 postagem');
      expect(el.querySelector<HTMLImageElement>('.perfil-foto')!.getAttribute('src')).toBe('assets/img/sem-foto.svg');
    });

    it('sem bio mostra "Sem bio ainda."', () => {
      abrir('5', of(perfil({ bio: null })));

      expect(el.querySelector('.perfil-bio-vazia')!.textContent).toBe('Sem bio ainda.');
    });

    it('SEGURANÇA: HTML na bio aparece como texto, nunca é executado', () => {
      abrir('5', of(perfil({ bio: '<img src=x onerror="window.__xss = true">' })));

      expect(el.querySelector('.perfil-bio img')).toBeNull();
      expect(el.querySelector('.perfil-bio')!.textContent).toContain('<img src=x');
    });

    it('lista só as postagens daquela pessoa', () => {
      abrir('5');

      expect(postagens.getPagina).toHaveBeenCalledOnceWith({ page: 0, size: 10, autor: 5 });
    });

    it('o topo do perfil e as postagens são dois retângulos separados (o topo fica acima do feed, não dentro dele)', () => {
      abrir('5');

      const topo = el.querySelector('.principal > .perfil-topo')!;
      const feed = el.querySelector('.principal > app-feed-postagens')!;
      expect(topo).not.toBeNull();
      expect(feed).not.toBeNull();
      expect(feed.querySelector('.perfil-topo')).toBeNull();
      expect(topo.compareDocumentPosition(feed) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('perfil inexistente (404) mostra aviso; o visitante volta ao início e quem tem conta, ao mural', () => {
      abrir('999', throwError(() => new HttpErrorResponse({ status: 404 })));

      expect(el.querySelector('[role="alert"]')!.textContent).toContain('Perfil não encontrado.');
      expect(el.querySelector('[role="alert"] a')!.getAttribute('href')).toBe('/');
      expect(postagens.getPagina).not.toHaveBeenCalled();
    });

    it('perfil inexistente, logado: o link volta ao mural', () => {
      logadoComo(5);
      abrir('999', throwError(() => new HttpErrorResponse({ status: 404 })));

      expect(el.querySelector('[role="alert"] a')!.getAttribute('href')).toBe('/explorar');
    });

    it('id que não é número não chega a chamar a API', () => {
      abrir('abc');

      expect(perfis.getPerfil).not.toHaveBeenCalled();
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('Perfil não encontrado.');
    });

    it('trocar de perfil na mesma rota carrega o novo', () => {
      abrir('5');
      perfis.getPerfil.and.returnValue(of(perfil({ id: 8, nome: 'Caio' })));

      params.next(convertToParamMap({ id: '8' }));
      fixture.detectChanges();

      expect(perfis.getPerfil).toHaveBeenCalledWith(8);
      expect(el.querySelector('.perfil-nome')!.textContent).toBe('Caio');
    });

    it('no perfil de outra pessoa logada não aparece nenhuma ação de edição', () => {
      logadoComo(99);
      abrir('5');

      expect(el.querySelector('.perfil-acoes')).toBeNull();
      expect(el.querySelector('app-compositor-comentario')).toBeNull();
    });
  });

  describe('o próprio perfil', () => {
    beforeEach(() => logadoComo(5));

    it('mostra o e-mail (só da sessão), a troca de foto, a caixa de rabisco e o atalho para um rascunho', () => {
      abrir('5');

      expect(el.querySelector('.perfil-email')!.textContent).toContain('bia@exemplo.com');
      expect(el.querySelector('.perfil-trocar-foto')).not.toBeNull();
      expect(el.querySelector('app-compositor-comentario')).not.toBeNull();
      expect(el.querySelector('.perfil-acoes a')!.getAttribute('href')).toBe('/postagens/nova');
    });

    it('a contagem acompanha o que a pessoa publica aqui mesmo', () => {
      abrir('5');

      fixture.componentInstance.aoPublicar();
      fixture.detectChanges();
      expect(el.querySelector('.perfil-contagem')!.textContent!.trim()).toBe('4 postagens');

      fixture.componentInstance.aoRemover();
      fixture.componentInstance.aoRemover();
      fixture.detectChanges();
      expect(el.querySelector('.perfil-contagem')!.textContent!.trim()).toBe('2 postagens');
    });

    it('a contagem diminui ao excluir uma postagem pelo menu', () => {
      const minha: Postagem = { id: 9, tipo: 'COMENTARIO', texto: 'oi', usuario: { id: 5, nome: 'Bia' } } as Postagem;
      postagens.getPagina.and.returnValue(of(pagina([minha])));
      postagens.delete.and.returnValue(of(void 0));
      abrir('5');

      el.querySelector<HTMLButtonElement>('.menu-botao')!.click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('.menu-lista button')!.click();
      fixture.detectChanges();
      // o menu só pergunta; a exclusão acontece quando a pessoa confirma no modal
      expect(postagens.delete).not.toHaveBeenCalled();
      el.querySelector<HTMLButtonElement>('app-confirmar-exclusao .zine-botao.perigo')!.click();
      fixture.detectChanges();

      expect(postagens.delete).toHaveBeenCalledWith(9);
      expect(el.querySelector('.perfil-contagem')!.textContent!.trim()).toBe('2 postagens');
    });

    describe('bio', () => {
      it('editar e salvar atualiza a bio na tela sem recarregar a página', () => {
        perfis.atualizarBio.and.returnValue(of(perfil({ bio: 'Nova bio' })));
        abrir('5');

        el.querySelector<HTMLButtonElement>('.perfil-acoes button')!.click();
        fixture.detectChanges();
        const campo = el.querySelector<HTMLTextAreaElement>('#bio')!;
        expect(campo.value).toBe('Escrevo sobre café.');

        campo.value = 'Nova bio';
        campo.dispatchEvent(new Event('input'));
        const envio = new Event('submit', { cancelable: true });
        el.querySelector('form.bio-form')!.dispatchEvent(envio);
        fixture.detectChanges();

        expect(envio.defaultPrevented).toBeTrue();
        expect(perfis.atualizarBio).toHaveBeenCalledWith(5, 'Nova bio');
        expect(el.querySelector('.perfil-bio')!.textContent).toBe('Nova bio');
        expect(el.querySelector('form.bio-form')).toBeNull();
      });

      it('mostra o erro e mantém o formulário aberto quando a API falha', () => {
        perfis.atualizarBio.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
        abrir('5');

        el.querySelector<HTMLButtonElement>('.perfil-acoes button')!.click();
        fixture.detectChanges();
        fixture.componentInstance.salvarBio();
        fixture.detectChanges();

        expect(el.querySelector('form.bio-form [role="alert"]')).not.toBeNull();
      });

      it('cancelar fecha o formulário sem chamar a API', () => {
        abrir('5');

        el.querySelector<HTMLButtonElement>('.perfil-acoes button')!.click();
        fixture.detectChanges();
        el.querySelector<HTMLButtonElement>('.botao-texto')!.click();
        fixture.detectChanges();

        expect(el.querySelector('form.bio-form')).toBeNull();
        expect(perfis.atualizarBio).not.toHaveBeenCalled();
      });

      it('não envia bio acima do limite', () => {
        abrir('5');

        fixture.componentInstance.editarBio();
        fixture.componentInstance.bio.setValue('x'.repeat(256));
        fixture.componentInstance.salvarBio();

        expect(perfis.atualizarBio).not.toHaveBeenCalled();
      });
    });

    describe('foto', () => {
      const escolher = (arquivo: File) => {
        const entrada = document.createElement('input');
        Object.defineProperty(entrada, 'files', { value: [arquivo] });
        fixture.componentInstance.onFileSelected({ target: entrada } as unknown as Event);
        fixture.detectChanges();
      };

      it('rejeita formato não suportado sem chamar a API', () => {
        abrir('5');

        escolher(new File(['x'], 'a.svg', { type: 'image/svg+xml' }));

        expect(auth.atualizarFoto).not.toHaveBeenCalled();
        expect(el.querySelector('.perfil-erro')!.textContent).toContain('Formato não suportado');
      });

      it('rejeita arquivo acima de 5MB', () => {
        abrir('5');
        const grande = new File(['x'], 'a.png', { type: 'image/png' });
        Object.defineProperty(grande, 'size', { value: 5 * 1024 * 1024 + 1 });

        escolher(grande);

        expect(auth.atualizarFoto).not.toHaveBeenCalled();
        expect(el.querySelector('.perfil-erro')!.textContent).toContain('muito grande');
      });

      it('envia a foto, atualiza a tela e a sessão', () => {
        auth.atualizarFoto.and.returnValue(of({ foto: 'https://cdn/nova.png' }));
        abrir('5');

        escolher(new File(['x'], 'a.png', { type: 'image/png' }));

        expect(auth.atualizarFoto).toHaveBeenCalledWith(5, jasmine.any(File));
        expect(auth.updateUsuario).toHaveBeenCalledWith({ foto: 'https://cdn/nova.png' });
        expect(el.querySelector<HTMLImageElement>('.perfil-foto')!.getAttribute('src')).toBe('https://cdn/nova.png');
      });
    });
  });

  describe('"no momento" dentro do topo (celular)', () => {
    const topo = () => el.querySelector('.perfil-topo .perfil-momento');

    it('aparece no topo do perfil quando a pessoa tem música ou livro, para quem visita', () => {
      abrir('5', of(perfil({ musicaAtual: 'Uma música', livroAtual: 'Um livro' })));

      expect(topo()).not.toBeNull();
      expect(topo()!.querySelector('.destaque-musica')!.textContent).toBe('Uma música');
      expect(topo()!.querySelector('.destaque-livro')!.textContent).toBe('Um livro');
      expect(topo()!.querySelector('.faixa')).not.toBeNull();
      expect(topo()!.querySelector('.botao')).toBeNull();
    });

    it('não aparece quando a pessoa não tem nada e quem olha não é a dona', () => {
      abrir('5');

      expect(topo()).toBeNull();
    });

    it('a dona sempre vê a seção, para poder adicionar', () => {
      logadoComo(5);
      abrir('5');

      expect(topo()).not.toBeNull();
      expect(topo()!.querySelector('.faixa .botao')!.textContent).toContain('Adicionar');
    });
  });
});
