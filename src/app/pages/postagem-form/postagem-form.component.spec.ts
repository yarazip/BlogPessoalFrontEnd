import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { Postagem } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { FonteService } from '../../services/fonte.service';
import { PostagemService } from '../../services/postagem.service';
import { TemaService } from '../../services/tema.service';
import { PostagemFormComponent } from './postagem-form.component';

describe('PostagemFormComponent', () => {
  let postagens: jasmine.SpyObj<PostagemService>;
  let temas: jasmine.SpyObj<TemaService>;
  let fontes: jasmine.SpyObj<FonteService>;
  let router: jasmine.SpyObj<Router>;
  let usuarioLogado: { id: number; nome: string };
  let fixture: ComponentFixture<PostagemFormComponent>;
  const CHAVE_NOVO = 'rasura:rascunho:5:novo';

  const criar = (id: string | null = null) => {
    TestBed.configureTestingModule({
      imports: [PostagemFormComponent],
      providers: [
        { provide: PostagemService, useValue: postagens },
        { provide: TemaService, useValue: temas },
        { provide: FonteService, useValue: fontes },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { getUsuario: () => usuarioLogado } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }
      ]
    });
    fixture = TestBed.createComponent(PostagemFormComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  afterEach(() => localStorage.clear());

  beforeEach(() => {
    localStorage.clear();
    usuarioLogado = { id: 5, nome: 'Ana' };
    postagens = jasmine.createSpyObj('PostagemService', ['create', 'update', 'getById']);
    temas = jasmine.createSpyObj('TemaService', ['getAll']);
    fontes = jasmine.createSpyObj('FonteService', ['carregar', 'carregarTodas']);
    temas.getAll.and.returnValue(of([{ id: 2, descricao: 'Java' }]));
    router = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], { events: of() });
  });

  it('valida com os mesmos limites da API (blog: título 5-100, texto 10-10000)', () => {
    const c = criar();

    c.postagemForm.patchValue({ titulo: 'abcd', texto: 'curto', temaId: 2 });
    expect(c.titulo.errors?.['minlength']).toBeTruthy();
    expect(c.texto.errors?.['minlength']).toBeTruthy();

    c.postagemForm.patchValue({ titulo: 'a'.repeat(101), texto: 'x'.repeat(10001) });
    expect(c.titulo.errors?.['maxlength']).toBeTruthy();
    expect(c.texto.errors?.['maxlength']).toBeTruthy();

    c.postagemForm.patchValue({ titulo: 'Título ok', texto: 'Texto com tamanho válido' });
    expect(c.postagemForm.valid).toBeTrue();

    // o blog aceita até 10.000 caracteres (antes eram 1.000)
    c.postagemForm.patchValue({ texto: 'x'.repeat(10000) });
    expect(c.postagemForm.valid).toBeTrue();
  });

  it('carrega os temas da API (sem lista inventada)', () => {
    const c = criar();

    expect(c.temas).toEqual([{ id: 2, descricao: 'Java' }]);
    expect(c.semTemas).toBeFalse();
  });

  it('sinaliza quando não há temas cadastrados', () => {
    temas.getAll.and.returnValue(of([]));

    expect(criar().semTemas).toBeTrue();
  });

  it('cria a postagem enviando idTema', () => {
    postagens.create.and.returnValue(of({ id: 9, titulo: 't', texto: 'x' }));
    const c = criar();
    c.postagemForm.setValue({ titulo: 'Título ok', texto: 'Texto com tamanho válido', temaId: 2, fonte: null });

    c.onSubmit();

    expect(postagens.create).toHaveBeenCalledWith({
      tipo: 'BLOG',
      titulo: 'Título ok',
      texto: 'Texto com tamanho válido',
      idTema: 2,
      fonte: null
    });
    expect(router.navigate).toHaveBeenCalledWith(['/postagens']);
  });

  it('na edição, carrega a postagem e atualiza pelo id', () => {
    postagens.getById.and.returnValue(
      of({ id: 5, titulo: 'Antigo título', texto: 'Texto antigo válido', tema: { id: 2, descricao: 'Java' } })
    );
    postagens.update.and.returnValue(of({ id: 5, titulo: 'Novo título', texto: 'Texto novo válido' }));
    const c = criar('5');

    expect(c.isEdit).toBeTrue();
    expect(c.postagemForm.getRawValue()).toEqual({ titulo: 'Antigo título', texto: 'Texto antigo válido', temaId: 2, fonte: null });

    c.postagemForm.patchValue({ titulo: 'Novo título' });
    c.onSubmit();

    expect(postagens.update).toHaveBeenCalledWith(5, {
      tipo: 'BLOG',
      titulo: 'Novo título',
      texto: 'Texto antigo válido',
      idTema: 2,
      fonte: null
    });
  });

  describe('fonte do rascunho', () => {
    const botaoDaFonte = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('app-seletor-de-fonte .fonte-botao')!;
    const opcoes = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('app-seletor-de-fonte .fonte-opcao'));

    it('a escolha de fonte é um botão só (e não uma grade de opções na tela)', () => {
      criar();
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-seletor-de-fonte .fonte-botao').length).toBe(1);
      expect(botaoDaFonte().textContent).toContain('Padrão do site');
      expect((fixture.nativeElement as HTMLElement).querySelector('app-seletor-de-fonte dialog')!.hasAttribute('open')).toBeFalse();
    });

    it('começa na fonte padrão do site', () => {
      const c = criar();
      fixture.detectChanges();

      expect(c.fonte.value).toBeNull();
    });

    it('pede ao serviço as fontes ao abrir o formulário de um rascunho novo', () => {
      criar();

      expect(fontes.carregarTodas).toHaveBeenCalledTimes(1);
    });

    it('escolher uma fonte envia a fonte junto com o rascunho', () => {
      postagens.create.and.returnValue(of({ id: 9, titulo: 't', texto: 'x' }));
      const c = criar();
      c.postagemForm.setValue({ titulo: 'Título ok', texto: 'Texto com tamanho válido', temaId: 2, fonte: 'RYE' });

      c.onSubmit();

      expect(postagens.create).toHaveBeenCalledOnceWith({
        tipo: 'BLOG',
        titulo: 'Título ok',
        texto: 'Texto com tamanho válido',
        idTema: 2,
        fonte: 'RYE'
      });
    });

    it('o botão abre a janela, escolher uma fonte a aplica ao rascunho e o botão passa a mostrar o nome dela', () => {
      const c = criar();
      fixture.detectChanges();

      botaoDaFonte().click();
      fixture.detectChanges();
      expect(opcoes().length).toBe(8);

      opcoes()[2].click();
      fixture.detectChanges();

      expect(c.fonte.value).toBe('FRAUNCES');
      expect(botaoDaFonte().textContent).toContain('Fraunces');
      expect(c.postagemForm.dirty).toBeTrue();
    });

    it('o que se digita já aparece na fonte escolhida (prévia ao vivo)', () => {
      const c = criar();
      c.fonte.setValue('MEA_CULPA');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect((el.querySelector('#titulo') as HTMLElement).style.fontFamily).toContain('Mea Culpa');
      expect((el.querySelector('#texto') as HTMLElement).style.fontFamily).toContain('Mea Culpa');

      c.fonte.setValue(null);
      fixture.detectChanges();
      expect((el.querySelector('#titulo') as HTMLElement).style.fontFamily).toBe('');
    });

    it('na edição, carrega a fonte já escolhida e a mantém ao salvar', () => {
      postagens.getById.and.returnValue(
        of({ id: 5, tipo: 'BLOG', titulo: 'Antigo título', texto: 'Texto antigo válido', tema: { id: 2, descricao: 'Java' }, fonte: 'RAMPART_ONE' })
      );
      postagens.update.and.returnValue(of({ id: 5, titulo: 't', texto: 'x' }));
      const c = criar('5');

      expect(c.fonte.value).toBe('RAMPART_ONE');
      expect(fontes.carregarTodas).toHaveBeenCalled();

      c.onSubmit();

      expect(postagens.update).toHaveBeenCalledOnceWith(5, jasmine.objectContaining({ tipo: 'BLOG', fonte: 'RAMPART_ONE' }));
    });

    it('um rascunho sem fonte (o padrão do site) volta como nulo na edição', () => {
      postagens.getById.and.returnValue(
        of({ id: 5, tipo: 'BLOG', titulo: 'Antigo título', texto: 'Texto antigo válido', tema: { id: 2, descricao: 'Java' } })
      );

      expect(criar('5').fonte.value).toBeNull();
    });

    it('o rabisco (comentário) não tem seletor de fonte nem baixa as fontes', () => {
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Comentário antigo', tema: null }));
      criar('8');
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).querySelector('app-seletor-de-fonte')).toBeNull();
      expect(fontes.carregarTodas).not.toHaveBeenCalled();
    });
  });

  describe('editando um comentário', () => {
    const abrirComentario = () => {
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Comentário antigo', tema: null }));
      postagens.update.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', texto: 'Comentário novo' }));
      return criar('8');
    };

    it('usa as regras do comentário: só o texto, até 280 caracteres, sem título nem tema', () => {
      const c = abrirComentario();

      expect(c.isComentario).toBeTrue();
      expect(c.limiteTexto).toBe(280);
      expect(c.titulo.valid).toBeTrue();
      expect(c.temaId.valid).toBeTrue();

      c.texto.setValue('x'.repeat(281));
      expect(c.texto.errors?.['maxlength']).toBeTruthy();
      c.texto.setValue('x'.repeat(280));
      expect(c.postagemForm.valid).toBeTrue();
    });

    it('envia COMENTARIO sem título nem tema', () => {
      const c = abrirComentario();
      c.texto.setValue('Comentário novo');

      c.onSubmit();

      expect(postagens.update).toHaveBeenCalledOnceWith(8, { tipo: 'COMENTARIO', texto: 'Comentário novo' });
      expect(router.navigate).toHaveBeenCalledWith(['/postagens']);
    });

    it('na tela não aparecem os campos de título e tema, e o título da página diz rabisco', () => {
      abrirComentario();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('#titulo')).toBeNull();
      expect(el.querySelector('#tema')).toBeNull();
      expect(el.querySelector('#texto')).not.toBeNull();
      expect(el.querySelector('h2')!.textContent).toBe('Editar rabisco');
      expect(el.querySelector('.contador-texto')!.textContent).toBe('17/280');
    });

    it('o blog continua com título, tema e contador até 10000', () => {
      const c = criar();
      c.postagemForm.patchValue({ texto: 'abc' });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('#titulo')).not.toBeNull();
      expect(el.querySelector('#tema')).not.toBeNull();
      expect(el.querySelector('h2')!.textContent).toBe('Novo rascunho');
      expect(el.querySelector('.contador-texto')!.textContent).toBe('3/10000');
    });
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const escrever = (c: PostagemFormComponent, dados: Partial<{ titulo: string; texto: string; temaId: number | null }> = {}) =>
    c.postagemForm.patchValue({ titulo: 'Meu título', texto: 'Um texto de rascunho com tamanho válido', temaId: 2, ...dados });

  describe('abas Escrever e Prévia', () => {
    const aba = (nome: 'escrever' | 'previa') => el().querySelector<HTMLButtonElement>(`#aba-${nome}`)!;
    const painelEscrever = () => el().querySelector<HTMLElement>('#painel-escrever')!;

    it('o rascunho tem as duas abas, com Escrever aberta e a prévia ainda não montada', () => {
      criar();

      expect(aba('escrever').getAttribute('aria-selected')).toBe('true');
      expect(aba('previa').getAttribute('aria-selected')).toBe('false');
      expect(painelEscrever().hidden).toBeFalse();
      expect(el().querySelector('app-previa-rascunho')).toBeNull();
    });

    it('Prévia mostra como o texto vai aparecer, com o que está escrito, a fonte e o tema', () => {
      const c = criar();
      escrever(c);
      c.fonte.setValue('MEA_CULPA');
      fixture.detectChanges();

      aba('previa').click();
      fixture.detectChanges();

      expect(painelEscrever().hidden).toBeTrue();
      expect(aba('previa').getAttribute('aria-selected')).toBe('true');
      const previa = el().querySelector('app-previa-rascunho')!;
      expect(previa.querySelector('.previa-titulo')!.textContent).toBe('Meu título');
      expect(previa.querySelector('.previa-texto')!.textContent).toContain('Um texto de rascunho');
      expect(previa.querySelector('.previa-tema')!.textContent).toBe('#Java');
      expect(previa.querySelector<HTMLElement>('.previa-titulo')!.style.fontFamily).toContain('Mea Culpa');
      expect(previa.querySelector('.previa-autor')!.textContent).toContain('Ana');
    });

    it('voltar para Escrever mantém o que foi digitado (os campos só ficam escondidos, não são apagados)', () => {
      const c = criar();
      escrever(c);
      aba('previa').click();
      fixture.detectChanges();

      aba('escrever').click();
      fixture.detectChanges();

      expect(painelEscrever().hidden).toBeFalse();
      expect(el().querySelector<HTMLInputElement>('#titulo')!.value).toBe('Meu título');
      expect(el().querySelector('app-previa-rascunho')).toBeNull();
    });

    it('as setas do teclado trocam de aba', () => {
      criar();
      document.body.appendChild(el());

      aba('escrever').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(aba('previa').getAttribute('aria-selected')).toBe('true');
      expect(document.activeElement).toBe(aba('previa'));

      aba('previa').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      fixture.detectChanges();
      expect(aba('escrever').getAttribute('aria-selected')).toBe('true');
      el().remove();
    });

    it('só a aba aberta entra na ordem do Tab (as abas se movem pelas setas)', () => {
      criar();

      expect(aba('escrever').getAttribute('tabindex')).toBe('0');
      expect(aba('previa').getAttribute('tabindex')).toBe('-1');
    });

    it('o rabisco não tem abas nem prévia (é curto e vai direto)', () => {
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Rabisco', tema: null }));
      criar('8');

      expect(el().querySelector('[role="tablist"]')).toBeNull();
      expect(el().querySelector('app-previa-rascunho')).toBeNull();
    });
  });

  describe('contadores', () => {
    it('mostra as palavras e o tempo de leitura ao vivo, além dos caracteres', () => {
      const c = criar();
      c.texto.setValue('Uma duas três quatro cinco.');
      fixture.detectChanges();

      expect(el().querySelector('.contador-palavras')!.textContent).toContain('5 palavras · 1 min de leitura');
      expect(el().querySelector('.contador-texto')!.textContent).toBe('27/10000');
    });

    it('usa o singular com uma palavra e conta 1 minuto quando está vazio', () => {
      const c = criar();
      expect(el().querySelector('.contador-palavras')!.textContent).toContain('0 palavras · 1 min de leitura');

      c.texto.setValue('Uma');
      fixture.detectChanges();
      expect(el().querySelector('.contador-palavras')!.textContent).toContain('1 palavra ·');
    });

    it('um texto de 450 palavras leva 3 minutos', () => {
      const c = criar();
      c.texto.setValue(Array(450).fill('palavra').join(' '));
      fixture.detectChanges();

      expect(el().querySelector('.contador-palavras')!.textContent).toContain('450 palavras · 3 min de leitura');
    });

    it('o rabisco só mostra os caracteres (sem palavras nem tempo de leitura)', () => {
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Rabisco', tema: null }));
      criar('8');

      expect(el().querySelector('.contador-palavras')).toBeNull();
      expect(el().querySelector('.contador-texto')).not.toBeNull();
    });
  });

  describe('salvamento automático no navegador', () => {
    const guardado = (chave = CHAVE_NOVO) => JSON.parse(localStorage.getItem(chave) ?? 'null');

    it('depois de uma pausa na digitação, guarda o rascunho novo no navegador', fakeAsync(() => {
      const c = criar();

      escrever(c);
      tick(499);
      expect(guardado()).toBeNull();
      tick(1);

      expect(guardado()).toEqual(jasmine.objectContaining({ titulo: 'Meu título', texto: 'Um texto de rascunho com tamanho válido', temaId: 2, fonte: null }));
      expect(guardado().salvoEm).toBeTruthy();
    }));

    it('várias teclas seguidas viram um salvamento só (com o texto mais recente)', fakeAsync(() => {
      const c = criar();
      spyOn(localStorage, 'setItem').and.callThrough();

      ['a', 'ab', 'abc', 'abcd'].forEach(t => {
        c.texto.setValue(t);
        tick(100);
      });
      tick(500);

      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(guardado().texto).toBe('abcd');
    }));

    it('um formulário que ainda não foi tocado não guarda nada', fakeAsync(() => {
      criar();

      tick(1000);

      expect(localStorage.getItem(CHAVE_NOVO)).toBeNull();
    }));

    it('se a pessoa apaga tudo e volta ao começo, o que estava guardado é apagado', fakeAsync(() => {
      const c = criar();
      escrever(c);
      tick(500);
      expect(guardado()).not.toBeNull();

      c.postagemForm.patchValue({ titulo: '', texto: '', temaId: null });
      tick(500);

      expect(localStorage.getItem(CHAVE_NOVO)).toBeNull();
    }));

    it('guarda também a fonte escolhida', fakeAsync(() => {
      const c = criar();
      c.fonte.setValue('RYE');
      tick(500);

      expect(guardado().fonte).toBe('RYE');
    }));

    it('sair da tela antes da pausa não perde as últimas letras (guarda ao destruir)', () => {
      const c = criar();
      escrever(c);

      fixture.destroy();

      expect(guardado().texto).toBe('Um texto de rascunho com tamanho válido');
    });

    it('cada pessoa tem o seu: outra conta no mesmo navegador não vê nem recebe o texto', () => {
      localStorage.setItem(CHAVE_NOVO, JSON.stringify({ titulo: 'Segredo da Ana', texto: 'texto da Ana', temaId: null, fonte: null, salvoEm: '2026-10-14T10:00:00Z' }));
      usuarioLogado = { id: 6, nome: 'Beto' };

      const c = criar();

      expect(c.titulo.value).toBe('');
      expect(el().querySelector('.aviso-recuperado')).toBeNull();
    });

    it('o rabisco nunca é guardado nem recuperado', fakeAsync(() => {
      localStorage.setItem('rasura:rascunho:5:8', JSON.stringify({ titulo: '', texto: 'antigo', temaId: null, fonte: null, salvoEm: '2026-10-14T10:00:00Z' }));
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Rabisco do servidor', tema: null }));
      const c = criar('8');

      c.texto.setValue('Outro rabisco');
      tick(1000);

      expect(c.texto.value).toBe('Outro rabisco');
      expect(el().querySelector('.aviso-recuperado')).toBeNull();
      expect(guardado('rasura:rascunho:5:8').texto).toBe('antigo'); // intocado
    }));
  });

  describe('recuperar o que estava guardado', () => {
    const salvo = { titulo: 'Título guardado', texto: 'Texto guardado que ficou pela metade', temaId: 2, fonte: 'RYE', salvoEm: '2026-10-14T17:32:00Z' };
    const guardarSalvo = (chave = CHAVE_NOVO, dados: object = salvo) => localStorage.setItem(chave, JSON.stringify(dados));

    it('um rascunho novo abre já com o texto guardado e avisa de quando é', () => {
      guardarSalvo();

      const c = criar();

      expect(c.titulo.value).toBe('Título guardado');
      expect(c.texto.value).toBe('Texto guardado que ficou pela metade');
      expect(c.temaId.value).toBe(2);
      expect(c.fonte.value).toBe('RYE');
      expect(el().querySelector('.aviso-recuperado')!.textContent).toContain('Recuperamos o que você estava escrevendo');
      expect(el().querySelector('.aviso-recuperado')!.textContent).toMatch(/14\/10 \d\d:\d\d/);
    });

    it('o aviso oferece descartar e começar do zero (e apaga o que estava guardado)', () => {
      guardarSalvo();
      const c = criar();

      el().querySelector<HTMLButtonElement>('.aviso-recuperado button')!.click();
      fixture.detectChanges();

      expect(el().querySelector('.aviso-recuperado button')).toBeNull();
      expect(c.titulo.value).toBe('');
      expect(c.texto.value).toBe('');
      expect(c.temaId.value).toBeNull();
      expect(c.fonte.value).toBeNull();
      expect(localStorage.getItem(CHAVE_NOVO)).toBeNull();
    });

    it('depois de descartar, nada fica guardado nem pede confirmação ao sair', fakeAsync(() => {
      guardarSalvo();
      const c = criar();
      el().querySelector<HTMLButtonElement>('.aviso-recuperado button')!.click();
      tick(600);

      expect(localStorage.getItem(CHAVE_NOVO)).toBeNull();
      expect(c.temAlteracoes).toBeFalse();
    }));

    it('texto recuperado conta como alteração não publicada', () => {
      guardarSalvo();

      expect(criar().temAlteracoes).toBeTrue();
    });

    it('dados guardados fora do formato esperado são ignorados (nada é restaurado)', () => {
      localStorage.setItem(CHAVE_NOVO, JSON.stringify({ titulo: 1, texto: 2 }));

      const c = criar();

      expect(c.titulo.value).toBe('');
      expect(el().querySelector('.aviso-recuperado')).toBeNull();
    });

    describe('na edição de um rascunho publicado', () => {
      const publicado: Postagem = { id: 5, tipo: 'BLOG', titulo: 'Título publicado', texto: 'Texto publicado válido', tema: { id: 2, descricao: 'Java' }, fonte: null };
      beforeEach(() => postagens.getById.and.returnValue(of(publicado)));

      it('restaura as alterações guardadas, e o aviso oferece voltar à versão publicada', () => {
        guardarSalvo('rasura:rascunho:5:5', { ...salvo, titulo: 'Título editado e não publicado', fonte: null });

        const c = criar('5');

        expect(c.titulo.value).toBe('Título editado e não publicado');
        expect(el().querySelector('.aviso-recuperado button')!.textContent).toContain('Voltar à versão publicada');
      });

      it('voltar à versão publicada devolve o que está na API e apaga o guardado', () => {
        guardarSalvo('rasura:rascunho:5:5', { ...salvo, titulo: 'Título editado e não publicado', fonte: null });
        const c = criar('5');

        el().querySelector<HTMLButtonElement>('.aviso-recuperado button')!.click();
        fixture.detectChanges();

        expect(c.titulo.value).toBe('Título publicado');
        expect(c.texto.value).toBe('Texto publicado válido');
        expect(localStorage.getItem('rasura:rascunho:5:5')).toBeNull();
        expect(c.temAlteracoes).toBeFalse();
      });

      it('se o guardado é igual ao publicado, não há o que recuperar (e é apagado)', () => {
        guardarSalvo('rasura:rascunho:5:5', { titulo: 'Título publicado', texto: 'Texto publicado válido', temaId: 2, fonte: null, salvoEm: '2026-10-14T17:32:00Z' });

        criar('5');

        expect(el().querySelector('.aviso-recuperado')).toBeNull();
        expect(localStorage.getItem('rasura:rascunho:5:5')).toBeNull();
      });

      it('sem nada guardado e sem mexer, não há alteração', () => {
        expect(criar('5').temAlteracoes).toBeFalse();
      });
    });
  });

  describe('sair da tela com alterações não publicadas', () => {
    const botaoDaJanela = (texto: string) =>
      Array.from(el().querySelectorAll<HTMLButtonElement>(':scope > app-modal .modal-rodape button')).find(b => b.textContent!.includes(texto))!;
    const janela = () => el().querySelector<HTMLDialogElement>(':scope > app-modal dialog')!;

    it('sem alterações, sair é livre e nenhuma janela abre', () => {
      const c = criar();

      expect(c.podeSair()).toBeTrue();
      expect(janela().open).toBeFalse();
    });

    it('com alterações, abre "Sair sem publicar?" e espera a resposta', async () => {
      const c = criar();
      escrever(c);

      const resposta = c.podeSair() as Promise<boolean>;
      fixture.detectChanges();

      expect(resposta instanceof Promise).toBeTrue();
      expect(janela().open).toBeTrue();
      expect(el().querySelector(':scope > app-modal .modal-titulo')!.textContent).toBe('Sair sem publicar?');
      expect(el().querySelector(':scope > app-modal .modal-corpo')!.textContent).toContain('ficam guardadas neste navegador');
      botaoDaJanela('Continuar').click();
      await resposta;
    });

    it('"Continuar escrevendo" fica na tela (e é o botão que recebe o foco)', async () => {
      const c = criar();
      escrever(c);
      const resposta = c.podeSair() as Promise<boolean>;
      fixture.detectChanges();

      expect(document.activeElement).toBe(botaoDaJanela('Continuar'));
      botaoDaJanela('Continuar').click();
      fixture.detectChanges();

      expect(await resposta).toBeFalse();
      expect(janela().open).toBeFalse();
    });

    it('"Sair" deixa sair', async () => {
      const c = criar();
      escrever(c);
      const resposta = c.podeSair() as Promise<boolean>;
      fixture.detectChanges();

      botaoDaJanela('Sair').click();
      fixture.detectChanges();

      expect(await resposta).toBeTrue();
      expect(janela().open).toBeFalse();
    });

    it('Esc ou X na janela contam como continuar escrevendo', async () => {
      const c = criar();
      escrever(c);
      const resposta = c.podeSair() as Promise<boolean>;
      fixture.detectChanges();

      el().querySelector<HTMLButtonElement>(':scope > app-modal .modal-x')!.click();
      fixture.detectChanges();

      expect(await resposta).toBeFalse();
    });

    it('o texto fica guardado no navegador mesmo se a pessoa escolher sair', async () => {
      const c = criar();
      escrever(c);
      const resposta = c.podeSair() as Promise<boolean>;
      fixture.detectChanges();

      expect(JSON.parse(localStorage.getItem(CHAVE_NOVO)!).titulo).toBe('Meu título');
      botaoDaJanela('Sair').click();
      await resposta;
    });

    it('depois de publicar, sair é livre (nada de pergunta por causa do texto que acabou de ser enviado)', () => {
      postagens.create.and.returnValue(of({ id: 9, titulo: 't', texto: 'x' }));
      const c = criar();
      escrever(c);

      c.onSubmit();

      expect(c.podeSair()).toBeTrue();
      expect(localStorage.getItem(CHAVE_NOVO)).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/postagens']);
    });

    it('se a publicação falhar, as alterações continuam valendo (e o texto guardado)', () => {
      postagens.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
      const c = criar();
      escrever(c);

      c.onSubmit();

      expect(c.temAlteracoes).toBeTrue();
    });

    it('o rabisco nunca pergunta ao sair', () => {
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Rabisco', tema: null }));
      const c = criar('8');
      c.texto.setValue('Rabisco editado');

      expect(c.podeSair()).toBeTrue();
    });

    it('fechar a aba com alterações pede confirmação ao navegador; sem alterações, não', () => {
      const c = criar();
      const sem = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      c.aoFecharAAba(sem);
      expect(sem.defaultPrevented).toBeFalse();

      escrever(c);
      const com = new Event('beforeunload', { cancelable: true }) as BeforeUnloadEvent;
      c.aoFecharAAba(com);
      expect(com.defaultPrevented).toBeTrue();
      expect(localStorage.getItem(CHAVE_NOVO)).not.toBeNull();
    });
  });

  describe('barra de ações e campo de texto', () => {
    it('a barra com Cancelar e Publicar existe (fica fixa embaixo por CSS)', () => {
      criar();

      expect(el().querySelector('form .form-actions .btn-primary')).not.toBeNull();
      expect(getComputedStyle(el().querySelector('.form-actions')!).position).toBe('sticky');
    });

    it('o campo de texto cresce com o conteúdo (sem barra de rolagem própria)', () => {
      criar();

      expect(getComputedStyle(el().querySelector('#texto')!).overflowY).toBe('hidden');
    });
  });

  describe('enquanto a postagem a editar carrega', () => {
    const el = () => fixture.nativeElement as HTMLElement;

    it('não mostra o formulário do rascunho (título, tema, fonte) antes de saber o tipo da postagem', () => {
      postagens.getById.and.returnValue(new Subject());
      criar('8');

      expect(el().querySelector('#titulo')).toBeNull();
      expect(el().querySelector('#tema')).toBeNull();
      expect(el().querySelector('#texto')).toBeNull();
      expect(el().querySelector('.fonte-grupo')).toBeNull();
      expect(el().querySelector('.carregando')!.textContent).toContain('Carregando');
      expect(el().querySelector('h2')!.textContent).toBe('Editar postagem');
    });

    it('um rabisco nunca passa por uma tela de rascunho: do carregando direto para o campo do rabisco', () => {
      const resposta = new Subject<Postagem>();
      postagens.getById.and.returnValue(resposta);
      criar('8');
      expect(el().querySelector('#titulo')).toBeNull();

      resposta.next({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Meu rabisco', tema: null });
      fixture.detectChanges();

      expect(el().querySelector('.carregando')).toBeNull();
      expect(el().querySelector('#titulo')).toBeNull();
      expect(el().querySelector('#tema')).toBeNull();
      expect(el().querySelector('#texto')).not.toBeNull();
      expect(el().querySelector('h2')!.textContent).toBe('Editar rabisco');
    });

    it('um rascunho aparece completo quando chega', () => {
      const resposta = new Subject<Postagem>();
      postagens.getById.and.returnValue(resposta);
      criar('7');

      resposta.next({ id: 7, tipo: 'BLOG', titulo: 'Meu título', texto: 'Texto do rascunho', tema: { id: 2, descricao: 'Java' } });
      fixture.detectChanges();

      expect(el().querySelector('#titulo')).not.toBeNull();
      expect(el().querySelector('#tema')).not.toBeNull();
      expect(el().querySelector<HTMLInputElement>('#titulo')!.value).toBe('Meu título');
      expect(el().querySelector('h2')!.textContent).toBe('Editar rascunho');
    });

    it('se a postagem não carregar, mostra só o aviso e o botão Voltar (sem formulário vazio de rascunho)', () => {
      postagens.getById.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      criar('8');

      expect(el().querySelector('[role="alert"]')!.textContent).toContain('Erro ao carregar postagem');
      expect(el().querySelector('form')).toBeNull();
      expect(el().querySelector('#titulo')).toBeNull();

      el().querySelector<HTMLButtonElement>('.btn-secondary')!.click();
      expect(router.navigate).toHaveBeenCalledWith(['/postagens']);
    });

    it('uma postagem nova abre o formulário na hora, sem passar pelo carregando', () => {
      criar();

      expect(el().querySelector('.carregando')).toBeNull();
      expect(el().querySelector('#titulo')).not.toBeNull();
    });
  });

  it('mostra o erro devolvido pela API e libera o botão', () => {
    postagens.create.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { errors: { titulo: 'O título é obrigatório' } } }))
    );
    const c = criar();
    c.postagemForm.setValue({ titulo: 'Título ok', texto: 'Texto com tamanho válido', temaId: 2, fonte: null });

    c.onSubmit();

    expect(c.errorMessage).toBe('O título é obrigatório');
    expect(c.isLoading).toBeFalse();
  });

  it('não envia se o formulário é inválido', () => {
    const c = criar();

    c.onSubmit();

    expect(postagens.create).not.toHaveBeenCalled();
  });

  describe('emojis da Rasura', () => {
    const campo = () => el().querySelector<HTMLTextAreaElement>('#texto')!;
    const escolher = (rotulo: string) => {
      el().querySelector<HTMLButtonElement>('.emoji-botao')!.click();
      fixture.detectChanges();
      el().querySelector<HTMLButtonElement>(`.emoji-opcao[aria-label="${rotulo}"]`)!.click();
      fixture.detectChanges();
    };

    it('o editor tem o botão de emoji, tanto no rascunho quanto no rabisco', () => {
      criar();
      expect(el().querySelector('app-seletor-de-emoji .emoji-botao')).not.toBeNull();

      TestBed.resetTestingModule();
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Rabisco', tema: null }));
      criar('8');
      expect(el().querySelector('app-seletor-de-emoji .emoji-botao')).not.toBeNull();
    });

    it('insere o código do emoji onde está o cursor e deixa o cursor logo depois', () => {
      const c = criar();
      escrever(c, { texto: 'Olá mundo' });
      fixture.detectChanges();
      campo().setSelectionRange(4, 4);

      escolher('Sol');

      expect(c.texto.value).toBe('Olá :sol:mundo');
      expect(campo().value).toBe('Olá :sol:mundo');
      expect(campo().selectionStart).toBe(9);
      expect(c.texto.dirty).toBeTrue();
    });

    it('troca o trecho selecionado pelo emoji', () => {
      const c = criar();
      escrever(c, { texto: 'Olá mundo' });
      fixture.detectChanges();
      campo().setSelectionRange(4, 9);

      escolher('Lua');

      expect(c.texto.value).toBe('Olá :lua:');
    });

    it('sem cursor definido, vai para o fim do texto', () => {
      const c = criar();
      escrever(c, { texto: 'Fim' });
      fixture.detectChanges();
      campo().setSelectionRange(3, 3);

      escolher('Estrela');

      expect(c.texto.value).toBe('Fim:estrela:');
    });

    it('não insere se o código passar do limite de caracteres', () => {
      const c = criar();
      const quase = 'x'.repeat(c.limiteTexto - 2);
      escrever(c, { texto: quase });
      fixture.detectChanges();
      campo().setSelectionRange(quase.length, quase.length);

      escolher('Sol');

      expect(c.texto.value).toBe(quase);
    });

    it('o código no texto aparece como desenho na prévia do mural', () => {
      const c = criar();
      escrever(c, { texto: 'Bom dia :sol: a todos' });
      fixture.detectChanges();

      el().querySelector<HTMLButtonElement>('#aba-previa')!.click();
      fixture.detectChanges();

      expect(el().querySelector('.previa-texto .emoji')!.getAttribute('aria-label')).toBe('Sol');
    });
  });

  describe('barra de ferramentas no topo', () => {
    const barra = () => el().querySelector<HTMLElement>('#painel-escrever > .barra-do-editor')!;

    it('o rascunho tem tema, fonte e emoji numa barra no topo da parte de escrever, antes do título', () => {
      criar();

      expect(barra()).not.toBeNull();
      expect(barra().querySelector('app-seletor-de-tema #tema')).not.toBeNull();
      expect(barra().querySelector('app-seletor-de-fonte .fonte-botao')).not.toBeNull();
      expect(barra().querySelector('app-seletor-de-emoji .emoji-botao')).not.toBeNull();
      expect(barra().compareDocumentPosition(el().querySelector('#titulo')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('tema e fonte não aparecem mais embaixo do texto (só na barra)', () => {
      criar();

      expect(el().querySelectorAll('app-seletor-de-tema').length).toBe(1);
      expect(el().querySelectorAll('app-seletor-de-fonte').length).toBe(1);
      expect(el().querySelector('select')).toBeNull();
    });

    it('a fonte aparece na versão compacta da barra', () => {
      criar();

      expect(barra().querySelector('app-seletor-de-fonte')!.classList).toContain('compacto');
    });

    it('o rabisco só tem o emoji na barra (não tem tema nem fonte)', () => {
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Rabisco', tema: null }));
      criar('8');

      expect(barra().querySelector('app-seletor-de-emoji')).not.toBeNull();
      expect(barra().querySelector('app-seletor-de-tema')).toBeNull();
      expect(barra().querySelector('app-seletor-de-fonte')).toBeNull();
    });

    it('falta de tema: depois de mexer, o botão fica vermelho e um aviso explica onde escolher', () => {
      const c = criar();
      expect(el().querySelector('.aviso-do-tema')).toBeNull();

      c.temaId.markAsTouched();
      fixture.detectChanges();

      expect(barra().querySelector('#tema')!.classList).toContain('invalido');
      expect(el().querySelector('.aviso-do-tema')!.textContent).toContain('Escolha um tema');
    });

    it('com tema escolhido, não há aviso', () => {
      const c = criar();
      c.temaId.setValue(2);
      c.temaId.markAsTouched();
      fixture.detectChanges();

      expect(el().querySelector('.aviso-do-tema')).toBeNull();
      expect(barra().querySelector('.tema-atual')!.textContent).toBe('#Java');
    });

    it('um tema criado na barra entra na lista, sem recarregar, e some o aviso de "nenhum tema"', () => {
      temas.getAll.and.returnValue(of([]));
      const c = criar();
      expect(c.semTemas).toBeTrue();

      c.temaCriado({ id: 7, descricao: 'Viagens' });

      expect(c.temas).toEqual([{ id: 7, descricao: 'Viagens' }]);
      expect(c.semTemas).toBeFalse();
    });
  });

  describe('post-its', () => {
    const FOTO = 'https://res.cloudinary.com/dlvrrvflc/image/upload/v1/abc.jpg';
    const guardado = (chave = CHAVE_NOVO) => JSON.parse(localStorage.getItem(chave) ?? 'null');

    it('o editor de post-its aparece no rascunho e não no rabisco', () => {
      criar();
      expect(el().querySelector('app-editor-de-postits')).not.toBeNull();
      // fora do bloco do texto, numa coluna própria (à esquerda pelo CSS)
      expect(el().querySelector('.card app-editor-de-postits')).toBeNull();
      expect(el().querySelector('.postagem-container.com-postits > .coluna-postits app-editor-de-postits')).not.toBeNull();

      TestBed.resetTestingModule();
      postagens.getById.and.returnValue(of({ id: 8, tipo: 'COMENTARIO', titulo: null, texto: 'Rabisco', tema: null }));
      criar('8');
      expect(el().querySelector('app-editor-de-postits')).toBeNull();
    });

    it('quem não usa post-its envia a postagem como sempre (sem os campos novos)', () => {
      postagens.create.and.returnValue(of({ id: 1 } as Postagem));
      const c = criar();
      escrever(c);

      c.onSubmit();

      const enviado = postagens.create.calls.mostRecent().args[0];
      expect('postits' in enviado).toBeFalse();
      expect('ladoDosPostits' in enviado).toBeFalse();
    });

    it('envia os post-its em ordem, sem campos vazios, e o lado escolhido', () => {
      postagens.create.and.returnValue(of({ id: 1 } as Postagem));
      const c = criar();
      escrever(c);
      c.mudarPostits([
        { tipo: 'NOTA', texto: '  Lembrar do café  ', fotoUrl: null, cor: 'AMARELO' },
        { tipo: 'FOTO', texto: '   ', fotoUrl: FOTO, cor: 'ROSA' }
      ]);
      c.mudarLado('ESQUERDA');

      c.onSubmit();

      expect(postagens.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          postits: [
            { tipo: 'NOTA', texto: 'Lembrar do café', cor: 'AMARELO' },
            { tipo: 'FOTO', fotoUrl: FOTO, texto: undefined, cor: 'ROSA' }
          ],
          ladoDosPostits: 'ESQUERDA'
        })
      );
    });

    it('post-it vazio impede publicar e explica o que falta', () => {
      const c = criar();
      escrever(c);
      c.mudarPostits([{ tipo: 'NOTA', texto: '', fotoUrl: null, cor: 'AMARELO' }]);
      expect(c.postitsProntos).toBeFalse();

      c.onSubmit();
      fixture.detectChanges();

      expect(postagens.create).not.toHaveBeenCalled();
      expect(el().querySelector('.alert-danger')!.textContent).toContain('Preencha os post-its');
    });

    describe('editando', () => {
      const publicada = (extra: Partial<Postagem> = {}): Postagem => ({
        id: 5,
        tipo: 'BLOG',
        titulo: 'Antigo título',
        texto: 'Texto antigo válido',
        tema: { id: 2, descricao: 'Java' },
        postits: [{ tipo: 'NOTA', texto: 'Já colado', cor: 'ROXO' }],
        ladoDosPostits: 'ESQUERDA',
        ...extra
      });

      it('carrega os post-its e o lado da postagem publicada', () => {
        postagens.getById.and.returnValue(of(publicada()));
        const c = criar('5');

        expect(c.postits).toEqual([{ tipo: 'NOTA', texto: 'Já colado', fotoUrl: null, cor: 'ROXO' }]);
        expect(c.ladoDosPostits).toBe('ESQUERDA');
      });

      it('sem mexer nos post-its, reenvia os mesmos (a API não recebe lista "vazia" por engano)', () => {
        postagens.getById.and.returnValue(of(publicada()));
        postagens.update.and.returnValue(of(publicada()));
        const c = criar('5');

        c.onSubmit();

        expect(postagens.update).toHaveBeenCalledWith(5, jasmine.objectContaining({ postits: [{ tipo: 'NOTA', texto: 'Já colado', cor: 'ROXO' }], ladoDosPostits: 'ESQUERDA' }));
      });

      it('remover todos os post-its manda a lista vazia (é assim que a API tira os que existiam)', () => {
        postagens.getById.and.returnValue(of(publicada()));
        postagens.update.and.returnValue(of(publicada({ postits: [] })));
        const c = criar('5');

        c.mudarPostits([]);
        c.onSubmit();

        expect(postagens.update).toHaveBeenCalledWith(5, jasmine.objectContaining({ postits: [] }));
      });

      it('uma postagem antiga, sem post-its, edita sem mandar os campos novos', () => {
        postagens.getById.and.returnValue(of(publicada({ postits: undefined, ladoDosPostits: undefined })));
        postagens.update.and.returnValue(of(publicada()));
        const c = criar('5');

        c.onSubmit();

        expect('postits' in postagens.update.calls.mostRecent().args[1]).toBeFalse();
      });
    });

    describe('guardado no navegador', () => {
      it('os post-its entram no salvamento automático, mesmo se só eles mudarem', fakeAsync(() => {
        const c = criar();

        c.mudarPostits([{ tipo: 'NOTA', texto: 'Guarde-me', fotoUrl: null, cor: 'VERDE' }]);
        c.mudarLado('ESQUERDA');
        tick(500);

        expect(guardado()).toEqual(jasmine.objectContaining({
          postits: [{ tipo: 'NOTA', texto: 'Guarde-me', fotoUrl: null, cor: 'VERDE' }],
          ladoDosPostits: 'ESQUERDA'
        }));
      }));

      it('ao reabrir, recupera os post-its guardados', () => {
        localStorage.setItem(CHAVE_NOVO, JSON.stringify({
          titulo: 'T', texto: 'texto guardado', temaId: null, fonte: null,
          postits: [{ tipo: 'FOTO', texto: 'Legenda', fotoUrl: FOTO, cor: 'ROSA' }], ladoDosPostits: 'ESQUERDA',
          salvoEm: '2026-10-14T10:00:00Z'
        }));

        const c = criar();

        expect(c.postits).toEqual([{ tipo: 'FOTO', texto: 'Legenda', fotoUrl: FOTO, cor: 'ROSA' }]);
        expect(c.ladoDosPostits).toBe('ESQUERDA');
        expect(c.recuperadoEm).not.toBeNull();
      });

      it('descartar o recuperado também tira os post-its recuperados', () => {
        localStorage.setItem(CHAVE_NOVO, JSON.stringify({
          titulo: 'T', texto: 'texto guardado', temaId: null, fonte: null,
          postits: [{ tipo: 'NOTA', texto: 'x', fotoUrl: null, cor: 'AMARELO' }], salvoEm: '2026-10-14T10:00:00Z'
        }));
        const c = criar();
        expect(c.postits.length).toBe(1);

        c.descartarRecuperado();

        expect(c.postits).toEqual([]);
        expect(c.ladoDosPostits).toBe('DIREITA');
      });
    });
  });
});
