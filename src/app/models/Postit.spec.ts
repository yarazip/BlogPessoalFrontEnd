import { CORES_DO_POSTIT, papelDaCor, postitCompleto } from './Postit';

describe('Postit', () => {
  it('um recado só está completo com texto (espaços não contam)', () => {
    expect(postitCompleto({ tipo: 'NOTA', texto: 'Oi', cor: 'AMARELO' })).toBeTrue();
    expect(postitCompleto({ tipo: 'NOTA', texto: '   ', cor: 'AMARELO' })).toBeFalse();
    expect(postitCompleto({ tipo: 'NOTA', cor: 'AMARELO' })).toBeFalse();
  });

  it('uma foto só está completa com o endereço (a legenda é opcional)', () => {
    expect(postitCompleto({ tipo: 'FOTO', fotoUrl: 'https://res.cloudinary.com/x.jpg', cor: 'ROSA' })).toBeTrue();
    expect(postitCompleto({ tipo: 'FOTO', texto: 'legenda', cor: 'ROSA' })).toBeFalse();
  });

  it('cada cor tem o seu papel, e há quatro', () => {
    expect(CORES_DO_POSTIT.length).toBe(4);
    expect(papelDaCor('AMARELO')).toBe('#ffe35c');
    expect(new Set(CORES_DO_POSTIT.map(c => c.papel)).size).toBe(4);
  });
});
