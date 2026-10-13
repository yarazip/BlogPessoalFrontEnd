import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { Postagem } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { CompositorComentarioComponent } from './compositor-comentario.component';

describe('CompositorComentarioComponent', () => {
  let fixture: ComponentFixture<CompositorComentarioComponent>;
  let el: HTMLElement;
  let service: jasmine.SpyObj<PostagemService>;
  let publicados: Postagem[];

  const criada: Postagem = { id: 9, tipo: 'COMENTARIO', texto: 'Olá, mundo', usuario: { id: 1, nome: 'Ana' } };

  const escrever = (valor: string) => {
    const campo = el.querySelector<HTMLTextAreaElement>('textarea')!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const botao = () => el.querySelector<HTMLButtonElement>('.compositor-publicar')!;

  beforeEach(() => {
    publicados = [];
    service = jasmine.createSpyObj('PostagemService', ['create']);
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getUsuario']);
    auth.getUsuario.and.returnValue({ id: 1, nome: 'Ana', foto: 'http://cdn/ana.png' });
    TestBed.configureTestingModule({
      imports: [CompositorComentarioComponent],
      providers: [
        { provide: PostagemService, useValue: service },
        { provide: AuthService, useValue: auth }
      ]
    });
    fixture = TestBed.createComponent(CompositorComentarioComponent);
    fixture.componentInstance.publicado.subscribe(p => publicados.push(p));
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  it('mostra a foto de quem está logado', () => {
    expect(el.querySelector('.compositor-foto')!.getAttribute('src')).toBe('http://cdn/ana.png');
  });

  it('o botão começa desligado e liga ao digitar', () => {
    expect(botao().disabled).toBeTrue();

    escrever('Oi');

    expect(botao().disabled).toBeFalse();
  });

  it('só espaços não contam como comentário', () => {
    escrever('     ');

    expect(botao().disabled).toBeTrue();
  });

  it('o contador mostra quantos caracteres restam e avisa perto do limite', () => {
    expect(el.querySelector('.compositor-contador')!.textContent).toBe('280');

    escrever('x'.repeat(265));

    expect(el.querySelector('.compositor-contador')!.textContent).toBe('15');
    expect(el.querySelector('.compositor-contador')!.classList).toContain('perto-do-limite');
  });

  it('passando de 280 o botão desliga (mesmo que o limite da API)', () => {
    fixture.componentInstance.texto.setValue('x'.repeat(281));
    fixture.detectChanges();

    expect(botao().disabled).toBeTrue();
  });

  it('publica como COMENTARIO (sem título nem tema), avisa o feed e limpa o campo', () => {
    service.create.and.returnValue(of(criada));
    escrever('  Olá, mundo  ');

    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();

    expect(service.create).toHaveBeenCalledOnceWith({ tipo: 'COMENTARIO', texto: 'Olá, mundo' });
    expect(publicados).toEqual([criada]);
    expect(el.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('');
    expect(botao().disabled).toBeTrue();
  });

  it('REGRESSÃO: enviar o formulário não deixa o navegador recarregar a página', () => {
    service.create.and.returnValue(of(criada));
    escrever('Olá');

    const envio = new Event('submit', { cancelable: true });
    el.querySelector('form')!.dispatchEvent(envio);

    expect(envio.defaultPrevented).toBeTrue();
  });

  it('se a API falhar, mostra o erro e mantém o texto digitado', () => {
    service.create.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    escrever('Não perca isto');

    fixture.componentInstance.publicar();
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Não foi possível publicar');
    expect(el.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('Não perca isto');
    expect(publicados).toEqual([]);
    expect(botao().disabled).toBeFalse();
  });

  it('não publica duas vezes enquanto a primeira ainda está enviando', () => {
    service.create.and.returnValue(new Observable<Postagem>(() => undefined)); // nunca responde
    escrever('Uma vez só');

    fixture.componentInstance.publicar();
    fixture.componentInstance.publicar();

    expect(service.create).toHaveBeenCalledTimes(1);
  });
});

