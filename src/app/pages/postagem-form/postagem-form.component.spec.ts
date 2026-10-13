import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FonteService } from '../../services/fonte.service';
import { PostagemService } from '../../services/postagem.service';
import { TemaService } from '../../services/tema.service';
import { PostagemFormComponent } from './postagem-form.component';

describe('PostagemFormComponent', () => {
  let postagens: jasmine.SpyObj<PostagemService>;
  let temas: jasmine.SpyObj<TemaService>;
  let fontes: jasmine.SpyObj<FonteService>;
  let router: jasmine.SpyObj<Router>;
  let fixture: ComponentFixture<PostagemFormComponent>;

  const criar = (id: string | null = null) => {
    TestBed.configureTestingModule({
      imports: [PostagemFormComponent],
      providers: [
        { provide: PostagemService, useValue: postagens },
        { provide: TemaService, useValue: temas },
        { provide: FonteService, useValue: fontes },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }
      ]
    });
    fixture = TestBed.createComponent(PostagemFormComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(() => {
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
    const opcoes = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.fonte-opcao'));

    it('oferece a fonte padrão do site e as 7 fontes, cada uma mostrada na própria fonte', () => {
      criar();
      fixture.detectChanges();

      expect(opcoes().length).toBe(8);
      expect(opcoes()[0].textContent).toContain('Padrão do site');
      const nomes = opcoes().slice(1).map(o => o.querySelector('.fonte-nome')!.textContent!.trim());
      expect(nomes).toEqual(['Instrument Serif', 'Fraunces', 'Righteous', 'Rye', 'Mea Culpa', 'Rubik Vinyl', 'Rampart One']);
      expect((opcoes()[4].querySelector('.fonte-nome') as HTMLElement).style.fontFamily).toContain('Rye');
    });

    it('começa na fonte padrão do site', () => {
      const c = criar();
      fixture.detectChanges();

      expect(c.fonte.value).toBeNull();
      expect(opcoes()[0].classList).toContain('escolhida');
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

    it('clicar numa opção escolhe a fonte e marca a opção', () => {
      const c = criar();
      fixture.detectChanges();

      (opcoes()[2].querySelector('input') as HTMLInputElement).click();
      fixture.detectChanges();

      expect(c.fonte.value).toBe('FRAUNCES');
      expect(opcoes()[2].classList).toContain('escolhida');
      expect(opcoes()[0].classList).not.toContain('escolhida');
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

      expect((fixture.nativeElement as HTMLElement).querySelector('.fonte-grupo')).toBeNull();
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
});
