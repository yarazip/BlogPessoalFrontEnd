import { TestBed } from '@angular/core/testing';
import { RascunhoLocalService } from './rascunho-local.service';

describe('RascunhoLocalService', () => {
  let service: RascunhoLocalService;
  const dados = { titulo: 'Meu título', texto: 'Texto do rascunho', temaId: 2, fonte: 'RYE' as const };

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(RascunhoLocalService);
  });

  afterEach(() => localStorage.clear());

  describe('chave', () => {
    it('separa por pessoa e por postagem', () => {
      expect(service.chave(5, null)).toBe('rasura:rascunho:5:novo');
      expect(service.chave(5, 9)).toBe('rasura:rascunho:5:9');
      expect(service.chave(6, null)).not.toBe(service.chave(5, null));
      expect(service.chave(undefined, null)).toBe('rasura:rascunho:anonimo:novo');
    });
  });

  it('guarda e devolve o rascunho, com a hora em que foi guardado', () => {
    const chave = service.chave(5, null);

    service.salvar(chave, dados);
    const salvo = service.carregar(chave)!;

    expect(salvo).toEqual(jasmine.objectContaining(dados));
    expect(new Date(salvo.salvoEm).getTime()).toBeCloseTo(Date.now(), -4);
  });

  it('sem nada guardado devolve nulo', () => {
    expect(service.carregar('rasura:rascunho:5:novo')).toBeNull();
  });

  it('limpar apaga só aquela chave', () => {
    service.salvar(service.chave(5, null), dados);
    service.salvar(service.chave(5, 9), dados);

    service.limpar(service.chave(5, null));

    expect(service.carregar(service.chave(5, null))).toBeNull();
    expect(service.carregar(service.chave(5, 9))).not.toBeNull();
  });

  it('aceita tema e fonte nulos', () => {
    const chave = service.chave(5, null);

    service.salvar(chave, { titulo: 't', texto: 'x', temaId: null, fonte: null });

    expect(service.carregar(chave)).toEqual(jasmine.objectContaining({ temaId: null, fonte: null }));
  });

  describe('dados de fora do formato esperado (alterados à mão ou de uma versão antiga)', () => {
    const guardarBruto = (valor: unknown) => localStorage.setItem('chave', typeof valor === 'string' ? valor : JSON.stringify(valor));

    it('JSON quebrado vira nulo, sem erro', () => {
      guardarBruto('{isso não é json');

      expect(service.carregar('chave')).toBeNull();
    });

    it('campos com tipo errado são recusados', () => {
      guardarBruto({ ...dados, salvoEm: 'x', titulo: 123 });
      expect(service.carregar('chave')).toBeNull();

      guardarBruto({ ...dados, salvoEm: 'x', texto: null });
      expect(service.carregar('chave')).toBeNull();

      guardarBruto({ ...dados, salvoEm: 'x', temaId: 'dois' });
      expect(service.carregar('chave')).toBeNull();
    });

    it('fonte que não existe é recusada', () => {
      guardarBruto({ ...dados, salvoEm: 'x', fonte: 'COMIC_SANS' });

      expect(service.carregar('chave')).toBeNull();
    });

    it('valores que não são objeto são recusados', () => {
      guardarBruto('"texto solto"');
      expect(service.carregar('chave')).toBeNull();

      guardarBruto('null');
      expect(service.carregar('chave')).toBeNull();
    });
  });

  describe('armazenamento indisponível (modo privado, bloqueio)', () => {
    beforeEach(() => {
      spyOn(Storage.prototype, 'getItem').and.throwError('bloqueado');
      spyOn(Storage.prototype, 'setItem').and.throwError('bloqueado');
      spyOn(Storage.prototype, 'removeItem').and.throwError('bloqueado');
    });

    it('nada quebra: carregar devolve nulo e salvar e limpar não lançam erro', () => {
      expect(service.carregar('x')).toBeNull();
      expect(() => service.salvar('x', dados)).not.toThrow();
      expect(() => service.limpar('x')).not.toThrow();
    });
  });

  describe('post-its guardados', () => {
    const base = { titulo: 'T', texto: 'texto', temaId: null, fonte: null, salvoEm: '2026-10-14T10:00:00Z' };
    const guardar = (extra: Record<string, unknown>) => localStorage.setItem('chave', JSON.stringify({ ...base, ...extra }));

    afterEach(() => localStorage.clear());

    it('guarda e devolve os post-its e o lado', () => {
      const servico = TestBed.inject(RascunhoLocalService);

      servico.salvar('chave', { titulo: 'T', texto: 'texto', temaId: null, fonte: null, postits: [{ tipo: 'NOTA', texto: 'oi', cor: 'ROSA' }], ladoDosPostits: 'ESQUERDA' });

      expect(servico.carregar('chave')).toEqual(jasmine.objectContaining({
        postits: [{ tipo: 'NOTA', texto: 'oi', fotoUrl: null, cor: 'ROSA' }],
        ladoDosPostits: 'ESQUERDA'
      }));
    });

    it('sem post-its guardados, o resultado é o de antes (sem as chaves novas)', () => {
      guardar({});
      const lido = TestBed.inject(RascunhoLocalService).carregar('chave')!;

      expect('postits' in lido).toBeFalse();
      expect('ladoDosPostits' in lido).toBeFalse();
    });

    it('recusa tudo se algum post-it está fora do formato (o navegador pode ter sido alterado)', () => {
      const servico = TestBed.inject(RascunhoLocalService);
      const ruins: Record<string, unknown>[] = [
        { postits: 'não é lista' },
        { postits: [{ tipo: 'VIDEO', texto: 'x', cor: 'ROSA' }] },
        { postits: [{ tipo: 'NOTA', texto: 'x', cor: 'AZUL' }] },
        { postits: [{ tipo: 'FOTO', fotoUrl: 'javascript:alert(1)', cor: 'ROSA' }] },
        { postits: [{ tipo: 'FOTO', fotoUrl: 'http://res.cloudinary.com/x.jpg', cor: 'ROSA' }] },
        { postits: [{ tipo: 'NOTA', texto: 5, cor: 'ROSA' }] },
        { postits: [null] },
        { postits: Array.from({ length: 4 }, () => ({ tipo: 'NOTA', texto: 'x', cor: 'ROSA' })) },
        { ladoDosPostits: 'CIMA' }
      ];

      for (const ruim of ruins) {
        guardar(ruim);
        expect(servico.carregar('chave')).withContext(JSON.stringify(ruim)).toBeNull();
      }
    });
  });
});
