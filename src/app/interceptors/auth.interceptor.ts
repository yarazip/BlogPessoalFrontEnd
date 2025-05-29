import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const rawToken = authService.getToken();

  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/usuarios/cadastrar'
  ];

  const isPublicRequest = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  if (isPublicRequest || !rawToken) {
    return next(req);
  }

  const token = rawToken.startsWith('Bearer ') ? rawToken.substring(7) : rawToken;

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!environment.production) {
    console.groupCollapsed(`HTTP Request to ${req.url}`);
    console.log('Authorization:', `Bearer ${token}`);
    console.log('Headers:', authReq.headers);
    console.groupEnd();
  }

  return next(authReq);
};
