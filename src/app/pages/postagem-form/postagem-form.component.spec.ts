import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PostagemService } from '../../services/postagem.service';
import { TemaService } from '../../services/tema.service';
import { PostagemFormComponent } from './postagem-form.component';

describe('PostagemFormComponent', () => {
  let postagens: jasmine.SpyObj<PostagemService>;
  let temas: jasmine.SpyObj<TemaService>;
  let router: jasmine.SpyObj<Router>;
  let fixture: ComponentFixture<PostagemFormComponent>;

  const criar = (id: string | null = null) => {
    TestBed.configureTestingModule({
      imports: [PostagemFormComponent],
      providers: [
        { provide: PostagemService, useValue: postagens },
        { provide: TemaService, useValue: temas },
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
    c.postagemForm.setValue({ titulo: 'Título ok', texto: 'Texto com tamanho válido', temaId: 2 });

    c.onSubmit();

    expect(postagens.create).toHaveBeenCalledWith({
      tipo: 'BLOG',
      titulo: 'Título ok',
      texto: 'Texto com tamanho válido',
      idTema: 2
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
    expect(c.postagemForm.getRawValue()).toEqual({ titulo: 'Antigo título', texto: 'Texto antigo válido', temaId: 2 });

    c.postagemForm.patchValue({ titulo: 'Novo título' });
    c.onSubmit();

    expect(postagens.update).toHaveBeenCalledWith(5, {
      tipo: 'BLOG',
      titulo: 'Novo título',
      texto: 'Texto antigo válido',
      idTema: 2
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
    c.postagemForm.setValue({ titulo: 'Título ok', texto: 'Texto com tamanho válido', temaId: 2 });

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
