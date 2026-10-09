import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PostagemService } from '../../services/postagem.service';
import { TemaService } from '../../services/tema.service';
import { PostagemFormComponent } from './postagem-form.component';

describe('PostagemFormComponent', () => {
  let postagens: jasmine.SpyObj<PostagemService>;
  let temas: jasmine.SpyObj<TemaService>;
  let router: jasmine.SpyObj<Router>;

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
    const fixture = TestBed.createComponent(PostagemFormComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(() => {
    postagens = jasmine.createSpyObj('PostagemService', ['create', 'update', 'getById']);
    temas = jasmine.createSpyObj('TemaService', ['getAll']);
    temas.getAll.and.returnValue(of([{ id: 2, descricao: 'Java' }]));
    router = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], { events: of() });
  });

  it('valida com os mesmos limites da API (título 5-100, texto 10-1000)', () => {
    const c = criar();

    c.postagemForm.patchValue({ titulo: 'abcd', texto: 'curto', temaId: 2 });
    expect(c.titulo.errors?.['minlength']).toBeTruthy();
    expect(c.texto.errors?.['minlength']).toBeTruthy();

    c.postagemForm.patchValue({ titulo: 'a'.repeat(101), texto: 'x'.repeat(1001) });
    expect(c.titulo.errors?.['maxlength']).toBeTruthy();
    expect(c.texto.errors?.['maxlength']).toBeTruthy();

    c.postagemForm.patchValue({ titulo: 'Título ok', texto: 'Texto com tamanho válido' });
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

    expect(postagens.create).toHaveBeenCalledWith({ titulo: 'Título ok', texto: 'Texto com tamanho válido', idTema: 2 });
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

    expect(postagens.update).toHaveBeenCalledWith(5, { titulo: 'Novo título', texto: 'Texto antigo válido', idTema: 2 });
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
