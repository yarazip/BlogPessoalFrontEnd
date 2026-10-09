import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDeErro } from './mensagem-de-erro';

describe('mensagemDeErro', () => {
  const padrao = 'mensagem padrão';

  it('usa a mensagem padrão para erros que não são de HTTP', () => {
    expect(mensagemDeErro(new Error('x'), padrao)).toBe(padrao);
    expect(mensagemDeErro(undefined, padrao)).toBe(padrao);
  });

  it('explica a falta de resposta do servidor (status 0)', () => {
    const erro = new HttpErrorResponse({ status: 0 });
    expect(mensagemDeErro(erro, padrao)).toContain('Não foi possível falar com o servidor');
  });

  it('junta as mensagens de validação por campo', () => {
    const erro = new HttpErrorResponse({
      status: 400,
      error: { detail: 'Dados inválidos.', errors: { email: 'Email inválido', senha: 'Senha curta' } }
    });
    expect(mensagemDeErro(erro, padrao)).toBe('Email inválido Senha curta');
  });

  it('usa o "detail" do formato RFC 7807', () => {
    const erro = new HttpErrorResponse({ status: 409, error: { detail: 'Email já está em uso.' } });
    expect(mensagemDeErro(erro, padrao)).toBe('Email já está em uso.');
  });

  it('inclui o código da requisição nos erros 500', () => {
    const erro = new HttpErrorResponse({
      status: 500,
      error: { detail: 'Erro interno no servidor.', requestId: 'abc-123' }
    });
    expect(mensagemDeErro(erro, padrao)).toBe('Erro interno no servidor. (código: abc-123)');
  });

  it('não mostra o código em erros que não são 500', () => {
    const erro = new HttpErrorResponse({ status: 404, error: { detail: 'Não encontrado.', requestId: 'abc' } });
    expect(mensagemDeErro(erro, padrao)).toBe('Não encontrado.');
  });

  it('cai na mensagem padrão quando o corpo não ajuda', () => {
    expect(mensagemDeErro(new HttpErrorResponse({ status: 500, error: 'texto solto' }), padrao)).toBe(padrao);
  });
});
