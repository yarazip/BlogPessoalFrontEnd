import { ICON_NAMES } from './icon/icon-names';
import { EMOJIS, codigoDe, iconeDe, inserirNoTexto, partirEmTrechos } from './emojis';

describe('emojis', () => {
  const sorriso = EMOJIS.find(e => e.nome === 'sorriso')!;

  it('todo emoji tem o desenho no sprite (nome na lista de ícones)', () => {
    for (const emoji of EMOJIS) {
      expect(ICON_NAMES).toContain(iconeDe(emoji));
    }
  });

  it('os nomes são únicos e só têm letras minúsculas (o que o código :nome: aceita)', () => {
    const nomes = EMOJIS.map(e => e.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
    nomes.forEach(n => expect(n).toMatch(/^[a-z]+$/));
  });

  it('o código do emoji é :nome:', () => {
    expect(codigoDe(sorriso)).toBe(':sorriso:');
  });

  describe('partirEmTrechos', () => {
    it('texto sem emojis vira um trecho só', () => {
      expect(partirEmTrechos('Só texto, nada de emoji.')).toEqual([{ tipo: 'texto', texto: 'Só texto, nada de emoji.' }]);
    });

    it('texto vazio não tem trechos', () => {
      expect(partirEmTrechos('')).toEqual([]);
    });

    it('troca cada código conhecido pelo emoji, mantendo o texto em volta', () => {
      const trechos = partirEmTrechos('Oi :sorriso: tudo bem? :amor:');

      expect(trechos.map(t => (t.tipo === 'emoji' ? `[${t.emoji.nome}]` : t.texto))).toEqual(['Oi ', '[sorriso]', ' tudo bem? ', '[amor]']);
    });

    it('emojis colados e nas pontas', () => {
      const trechos = partirEmTrechos(':fogo::fogo:fim');

      expect(trechos.map(t => (t.tipo === 'emoji' ? `[${t.emoji.nome}]` : t.texto))).toEqual(['[fogo]', '[fogo]', 'fim']);
    });

    it('código desconhecido continua sendo texto (ninguém perde o que escreveu)', () => {
      expect(partirEmTrechos('Isso :naoexiste: fica')).toEqual([{ tipo: 'texto', texto: 'Isso :naoexiste: fica' }]);
    });

    it('um código desconhecido no meio não atrapalha os conhecidos em volta', () => {
      const trechos = partirEmTrechos(':sol: a :xis: b :lua:');

      expect(trechos.map(t => (t.tipo === 'emoji' ? `[${t.emoji.nome}]` : t.texto))).toEqual(['[sol]', ' a :xis: b ', '[lua]']);
    });

    it('um código desconhecido colado a um conhecido não o esconde (:a:sol:)', () => {
      const trechos = partirEmTrechos(':a:sol:');

      expect(trechos.map(t => (t.tipo === 'emoji' ? `[${t.emoji.nome}]` : t.texto))).toEqual([':a', '[sol]']);
    });

    it('horas, portas e maiúsculas não viram emoji', () => {
      expect(partirEmTrechos('Às 10:30:45 em localhost:8080:x e :SOL:')).toEqual([
        { tipo: 'texto', texto: 'Às 10:30:45 em localhost:8080:x e :SOL:' }
      ]);
    });

    it('preserva quebras de linha e espaços', () => {
      const trechos = partirEmTrechos('linha 1\n\n:estrela:  linha 3');

      expect(trechos.map(t => (t.tipo === 'emoji' ? `[${t.emoji.nome}]` : t.texto))).toEqual(['linha 1\n\n', '[estrela]', '  linha 3']);
    });

    it('SEGURANÇA: HTML no texto continua sendo só texto, nunca vira elemento', () => {
      const trechos = partirEmTrechos('<img src=x onerror=alert(1)> :sorriso:');

      expect(trechos[0]).toEqual({ tipo: 'texto', texto: '<img src=x onerror=alert(1)> ' });
      expect(trechos.length).toBe(2);
    });
  });

  describe('inserirNoTexto', () => {
    it('insere no cursor e devolve onde o cursor fica depois', () => {
      expect(inserirNoTexto('Olá mundo', 4, 4, ':sol:', 100)).toEqual({ texto: 'Olá :sol:mundo', cursor: 9 });
    });

    it('troca a seleção pelo trecho', () => {
      expect(inserirNoTexto('Olá mundo', 4, 9, ':lua:', 100)).toEqual({ texto: 'Olá :lua:', cursor: 9 });
    });

    it('aceita seleção "ao contrário" (fim antes do início)', () => {
      expect(inserirNoTexto('abcdef', 4, 2, 'X', 100)).toEqual({ texto: 'abXef', cursor: 3 });
    });

    it('no fim do texto e em texto vazio', () => {
      expect(inserirNoTexto('abc', 3, 3, ':sol:', 100)).toEqual({ texto: 'abc:sol:', cursor: 8 });
      expect(inserirNoTexto('', 0, 0, ':sol:', 100)).toEqual({ texto: ':sol:', cursor: 5 });
    });

    it('posição fora do texto é ajustada às pontas', () => {
      expect(inserirNoTexto('abc', 99, 99, 'X', 100)).toEqual({ texto: 'abcX', cursor: 4 });
    });

    it('não insere se passar do limite de caracteres', () => {
      expect(inserirNoTexto('x'.repeat(278), 278, 278, ':sol:', 280)).toBeNull();
      expect(inserirNoTexto('x'.repeat(275), 275, 275, ':sol:', 280)).not.toBeNull();
    });
  });
});
