import { TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  const criar = () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const link = (el: HTMLElement, rotulo: string) =>
    Array.from(el.querySelectorAll('a')).find(a => a.textContent?.includes(rotulo))!;

  it('mostra os contatos reais, sem links vazios', () => {
    const el = criar();

    expect(link(el, 'GitHub').getAttribute('href')).toBe('https://github.com/yarazip');
    expect(link(el, 'LinkedIn').getAttribute('href')).toBe('https://www.linkedin.com/in/yara-rosa-dev');
    expect(link(el, 'E-mail').getAttribute('href')).toBe('mailto:yaradev@gmail.com');
    expect(Array.from(el.querySelectorAll('a')).some(a => a.getAttribute('href') === '#')).toBeFalse();
  });

  it('abre os perfis em outra aba sem expor a janela de origem', () => {
    const el = criar();

    for (const rotulo of ['GitHub', 'LinkedIn']) {
      expect(link(el, rotulo).getAttribute('target')).toBe('_blank');
      expect(link(el, rotulo).getAttribute('rel')).toBe('noopener noreferrer');
    }
    expect(link(el, 'E-mail').hasAttribute('target')).toBeFalse();
  });

  it('mostra o ano corrente nos direitos', () => {
    expect(criar().textContent).toContain(`© ${new Date().getFullYear()}`);
  });
});
