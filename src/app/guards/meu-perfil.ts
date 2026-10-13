import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Atalho para a página da própria pessoa: com sessão, leva a /perfil/{id}; sem sessão, ao login, que
 * volta para `destino` depois de entrar. Serve para links antigos (/perfil e /postagens) e para os
 * menus, que não precisam conhecer o id.
 *
 * Uso em rota: { path: 'perfil', pathMatch: 'full', redirectTo: paraMeuPerfil('/perfil') }
 */
export function paraMeuPerfil(destino: string): () => string | UrlTree {
  return () => {
    const auth = inject(AuthService);
    const usuario = auth.getUsuario();

    if (auth.isLoggedIn() && usuario) {
      return `/perfil/${usuario.id}`;
    }
    return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: destino } });
  };
}
