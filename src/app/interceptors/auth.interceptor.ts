import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Rotas que não recebem o token (e cujo 401 significa credencial errada, não sessão vencida). */
const ROTAS_PUBLICAS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // O token só vai para a nossa API: nunca para CDNs ou qualquer outro domínio.
  const ehDaApi = req.url.startsWith(environment.apiUrl);
  const ehPublica = ROTAS_PUBLICAS.some(rota => req.url.startsWith(environment.apiUrl + rota));
  const token = authService.getToken();
  const autenticada = ehDaApi && !ehPublica && !!token;

  const requisicao = autenticada ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(requisicao).pipe(
    catchError((erro: unknown) => {
      if (autenticada && erro instanceof HttpErrorResponse && erro.status === 401) {
        authService.sessaoExpirada();
      }
      return throwError(() => erro);
    })
  );
};
