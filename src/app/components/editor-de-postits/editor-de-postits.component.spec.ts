import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LadoDosPostits, Postit } from '../../models/Postit';
import { PostagemService } from '../../services/postagem.service';
import { EditorDePostitsComponent } from './editor-de-postits.component';

describe('EditorDePostitsComponent', () => {
  let fixture: ComponentFixture<EditorDePostitsComponent>;
  let el: HTMLElement;
  let servico: jasmine.SpyObj<PostagemService>;
  let postits: Postit[];
  let lado: LadoDosPostits;

  /** O componente é controlado: os eventos dele voltam como novas entradas, como faz o formulário. */
  const montar = (iniciais: Postit[] = [], ladoInicial: LadoDosPostits = 'DIREITA') => {
    postits = iniciais;
    lado = ladoInicial;
    fixture = TestBed.createComponent(EditorDePostitsComponent);
    fixture.componentRef.setInput('postits', postits);
    fixture.componentRef.setInput('lado', lado);
    fixture.componentInstance.postitsChange.subscribe(novos => {
      postits = novos;
      fixture.componentRef.setInput('postits', novos);
      fixture.detectChanges();
    });
    fixture.componentInstance.ladoChange.subscribe(novo => {
      lado = novo;
      fixture.componentRef.setInput('lado', novo);
      fixture.detectChanges();
    });
    fixture.detectChanges();
    el = fixture.nativeElement;
  };

  const adicionarRecado = () => el.querySelectorAll<HTMLButtonElement>('.adicionar')[0];
  const adicionarFoto = () => el.querySelectorAll<HTMLButtonElement>('.adicionar')[1];
  const cartoes = () => el.querySelectorAll('.postit-editor');

  beforeEach(() => {
    servico = jasmine.createSpyObj('PostagemService', ['enviarFotoDePostit']);
    TestBed.configureTestingModule({ imports: [EditorDePostitsComponent], providers: [{ provide: PostagemService, useValue: servico }] });
  });

  it('começa sem post-its, com os botões de adicionar e sem a escolha de lado', () => {
    montar();

    expect(cartoes().length).toBe(0);
    expect(el.querySelector('.postits-quantos')!.textContent).toContain('0 de 3');
    expect(el.querySelector('.postits-lado')).toBeNull();
    expect(adicionarRecado().disabled).toBeFalse();
  });

  it('+ Recado e + Foto acrescentam um post-it de cada tipo, cada um numa cor', () => {
    montar();

    adicionarRecado().click();
    adicionarFoto().click();

    expect(postits.map(p => p.tipo)).toEqual(['NOTA', 'FOTO']);
    expect(postits.map(p => p.cor)).toEqual(['AMARELO', 'ROSA']);
    expect(cartoes().length).toBe(2);
    expect(el.querySelector('.postits-lado')).not.toBeNull();
  });

  it('no máximo três: ao chegar lá, os botões de adicionar travam e avisa', () => {
    montar();
    for (let i = 0; i < 5; i++) {
      adicionarRecado().click();
    }

    expect(postits.length).toBe(3);
    expect(adicionarRecado().disabled).toBeTrue();
    expect(adicionarFoto().disabled).toBeTrue();
    expect(el.querySelector('.cheio')!.textContent).toContain('3 post-its');
  });

  it('digitar o recado atualiza o texto e o contador; o campo respeita o limite', () => {
    montar([{ tipo: 'NOTA', texto: '', cor: 'AMARELO' }]);

    const campo = el.querySelector<HTMLTextAreaElement>('textarea')!;
    campo.value = 'Lembrar do café';
    campo.dispatchEvent(new Event('input'));

    expect(postits[0].texto).toBe('Lembrar do café');
    expect(el.querySelector('.contador')!.textContent).toContain('15/140');
    expect(campo.getAttribute('maxlength')).toBe('140');
  });

  it('um post-it vazio avisa que falta o recado (ou a foto)', () => {
    montar([{ tipo: 'NOTA', texto: '', cor: 'AMARELO' }, { tipo: 'FOTO', fotoUrl: null, cor: 'ROSA' }]);

    const avisos = Array.from(el.querySelectorAll('.aviso')).map(a => a.textContent);
    expect(avisos[0]).toContain('Escreva o recado');
    expect(avisos[1]).toContain('Escolha a foto');
  });

  it('trocar a cor muda só a cor', () => {
    montar([{ tipo: 'NOTA', texto: 'oi', cor: 'AMARELO' }]);

    el.querySelector<HTMLButtonElement>('.cor[aria-label="Verde"]')!.click();

    expect(postits[0]).toEqual({ tipo: 'NOTA', texto: 'oi', cor: 'VERDE' });
  });

  it('remover tira o post-it; subir e descer trocam de lugar (os das pontas travam)', () => {
    montar([
      { tipo: 'NOTA', texto: 'A', cor: 'AMARELO' },
      { tipo: 'NOTA', texto: 'B', cor: 'ROSA' },
      { tipo: 'NOTA', texto: 'C', cor: 'ROXO' }
    ]);
    const subir = (i: number) => cartoes()[i].querySelector<HTMLButtonElement>('[aria-label="Subir"]')!;
    const descer = (i: number) => cartoes()[i].querySelector<HTMLButtonElement>('[aria-label="Descer"]')!;
    expect(subir(0).disabled).toBeTrue();
    expect(descer(2).disabled).toBeTrue();

    descer(0).click();
    expect(postits.map(p => p.texto)).toEqual(['B', 'A', 'C']);

    subir(2).click();
    expect(postits.map(p => p.texto)).toEqual(['B', 'C', 'A']);

    cartoes()[1].querySelector<HTMLButtonElement>('[aria-label="Remover post-it"]')!.click();
    expect(postits.map(p => p.texto)).toEqual(['B', 'A']);
  });

  it('o lado escolhido volta pelo evento', () => {
    montar([{ tipo: 'NOTA', texto: 'oi', cor: 'AMARELO' }], 'DIREITA');
    expect(el.querySelector<HTMLInputElement>('input[value="DIREITA"]')!.checked).toBeTrue();

    el.querySelector<HTMLInputElement>('input[value="ESQUERDA"]')!.click();

    expect(lado).toBe('ESQUERDA');
  });

  describe('foto', () => {
    const escolher = (arquivo: File) => {
      const entrada = el.querySelector<HTMLInputElement>('input[type="file"]')!;
      const dados = new DataTransfer();
      dados.items.add(arquivo);
      entrada.files = dados.files;
      entrada.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };

    it('envia a foto, guarda o endereço que a API devolve e passa a mostrar a prévia', () => {
      servico.enviarFotoDePostit.and.returnValue(of({ url: 'https://res.cloudinary.com/x/foto.jpg' }));
      montar([{ tipo: 'FOTO', fotoUrl: null, cor: 'ROSA' }]);

      escolher(new File([new Uint8Array(10)], 'foto.png', { type: 'image/png' }));

      expect(servico.enviarFotoDePostit).toHaveBeenCalledTimes(1);
      expect(postits[0].fotoUrl).toBe('https://res.cloudinary.com/x/foto.jpg');
      expect(el.querySelector('.postit-previa')!.getAttribute('src')).toBe('https://res.cloudinary.com/x/foto.jpg');
      expect(el.querySelector('.botao-foto')!.textContent).toContain('Trocar foto');
    });

    it('recusa formato errado e arquivo grande, sem chamar a API', () => {
      montar([{ tipo: 'FOTO', fotoUrl: null, cor: 'ROSA' }]);

      escolher(new File(['x'], 'doc.pdf', { type: 'application/pdf' }));
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('Formato não suportado');

      escolher(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.jpg', { type: 'image/jpeg' }));
      expect(el.querySelector('[role="alert"]')!.textContent).toContain('muito grande');
      expect(servico.enviarFotoDePostit).not.toHaveBeenCalled();
    });

    it('se o envio falhar, mostra o motivo e não mexe no post-it', () => {
      servico.enviarFotoDePostit.and.returnValue(throwError(() => new HttpErrorResponse({ status: 429, error: { detail: 'Muitas fotos enviadas.' } })));
      montar([{ tipo: 'FOTO', fotoUrl: null, cor: 'ROSA' }]);

      escolher(new File([new Uint8Array(10)], 'foto.png', { type: 'image/png' }));

      expect(el.querySelector('[role="alert"]')!.textContent).toContain('Muitas fotos enviadas');
      expect(postits[0].fotoUrl).toBeNull();
    });

    it('a legenda é um campo curto e opcional', () => {
      montar([{ tipo: 'FOTO', fotoUrl: 'https://res.cloudinary.com/x/foto.jpg', cor: 'ROSA' }]);

      const legenda = el.querySelector<HTMLInputElement>('.legenda')!;
      legenda.value = 'Meu caderno';
      legenda.dispatchEvent(new Event('input'));

      expect(legenda.getAttribute('maxlength')).toBe('60');
      expect(postits[0].texto).toBe('Meu caderno');
      expect(el.querySelector('.aviso')).toBeNull();
    });
  });
});
