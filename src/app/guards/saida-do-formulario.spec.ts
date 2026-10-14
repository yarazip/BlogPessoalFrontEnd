import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import type { PostagemFormComponent } from '../pages/postagem-form/postagem-form.component';
import { saidaDoFormulario } from './saida-do-formulario';

describe('saidaDoFormulario', () => {
  const executar = (componente: Pick<PostagemFormComponent, 'podeSair'>) =>
    TestBed.runInInjectionContext(() =>
      saidaDoFormulario(componente as PostagemFormComponent, {} as ActivatedRouteSnapshot, {} as RouterStateSnapshot, {} as RouterStateSnapshot)
    );

  it('deixa a tela decidir: sem alterações, a saída é livre', () => {
    expect(executar({ podeSair: () => true })).toBeTrue();
  });

  it('com alterações, espera a resposta da pessoa', async () => {
    expect(await executar({ podeSair: () => Promise.resolve(false) })).toBeFalse();
    expect(await executar({ podeSair: () => Promise.resolve(true) })).toBeTrue();
  });
});
