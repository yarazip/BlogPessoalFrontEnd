import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { FONTES } from '../models/Fonte';
import { FonteService } from './fonte.service';

describe('FonteService', () => {
  let service: FonteService;
  let head: HTMLHeadElement;
  let adicionados: HTMLLinkElement[];

  /** Um <head> de mentira: o teste não pede fonte nenhuma ao Google de verdade. */
  beforeEach(() => {
    head = document.createElement('head');
    adicionados = [];
    spyOn(head, 'appendChild').and.callFake(<T extends Node>(no: T): T => {
      adicionados.push(no as unknown as HTMLLinkElement);
      return no;
    });
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { head, createElement: (tag: string) => document.createElement(tag) } }]
    });
    service = TestBed.inject(FonteService);
  });

  it('pede o CSS da fonte ao Google Fonts, com display=swap', () => {
    service.carregar('MEA_CULPA');

    expect(adicionados.length).toBe(1);
    expect(adicionados[0].rel).toBe('stylesheet');
    expect(adicionados[0].href).toBe('https://fonts.googleapis.com/css2?family=Mea+Culpa&display=swap');
    expect(adicionados[0].dataset['fonte']).toBe('MEA_CULPA');
  });

  it('a Fraunces pede os dois pesos (normal e negrito)', () => {
    service.carregar('FRAUNCES');

    expect(adicionados[0].href).toContain('family=Fraunces:wght@400;700');
  });

  it('pede cada fonte uma vez só, não importa quantas postagens a usem', () => {
    service.carregar('RYE');
    service.carregar('RYE');
    service.carregar('RYE');

    expect(adicionados.length).toBe(1);
  });

  it('ignora nulo, ausente e fonte que não existe (a padrão do site não precisa de download)', () => {
    service.carregar(null);
    service.carregar(undefined);
    service.carregar('NAO_EXISTE' as never);

    expect(adicionados.length).toBe(0);
  });

  it('carregarTodas pede as 7 fontes, cada uma uma vez (seletor do formulário)', () => {
    service.carregarTodas();
    service.carregarTodas();

    expect(adicionados.length).toBe(FONTES.length);
    expect(new Set(adicionados.map(l => l.dataset['fonte'])).size).toBe(FONTES.length);
  });
});
