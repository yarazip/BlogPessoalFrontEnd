import { HttpErrorResponse } from '@angular/common/http';

/**
 * Transforma um erro de HTTP em uma mensagem para o usuário.
 * A API devolve erros no padrão RFC 7807: {detail}, com {errors: {campo: mensagem}} na validação
 * e {requestId} nos erros 500.
 */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (!(erro instanceof HttpErrorResponse)) {
    return padrao;
  }

  // status 0: sem resposta (rede caiu, CORS, ou servidor gratuito ainda "acordando")
  if (erro.status === 0) {
    return 'Não foi possível falar com o servidor. Ele pode estar iniciando; tente novamente em instantes.';
  }

  const corpo = erro.error;
  if (corpo && typeof corpo === 'object') {
    const campos =
      corpo.errors && typeof corpo.errors === 'object'
        ? Object.values(corpo.errors).filter((m): m is string => typeof m === 'string')
        : [];
    if (campos.length > 0) {
      return campos.join(' ');
    }

    if (typeof corpo.detail === 'string' && corpo.detail) {
      const codigo = erro.status >= 500 && corpo.requestId ? ` (código: ${corpo.requestId})` : '';
      return corpo.detail + codigo;
    }
  }

  return padrao;
}
