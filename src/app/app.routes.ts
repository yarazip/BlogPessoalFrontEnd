import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Blogify - Página Inicial'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Blogify - Login'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    title: 'Blogify - Cadastro'
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./pages/esqueci-senha/esqueci-senha.component').then(m => m.EsqueciSenhaComponent),
    title: 'Blogify - Recuperar Senha'
  },
  {
    path: 'explorar',
    loadComponent: () => import('./pages/explorar/explorar.component').then(m => m.ExplorarComponent),
    title: 'Blogify - Explorar'
  },

  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Blogify - Insights'
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent),
    canActivate: [authGuard],
    title: 'Blogify - Perfil'
  },
  {
    // perfil público de qualquer pessoa: sem guarda, qualquer um pode ver
    path: 'perfil/:id',
    loadComponent: () => import('./pages/perfil-publico/perfil-publico.component').then(m => m.PerfilPublicoComponent),
    title: 'Blogify - Perfil'
  },
  {
    path: 'postagens',
    loadComponent: () => import('./pages/postagem-list/postagem-list.component').then(m => m.PostagemListComponent),
    canActivate: [authGuard],
    title: 'Blogify - Postagens'
  },
  {
    path: 'postagens/nova',
    loadComponent: () => import('./pages/postagem-form/postagem-form.component').then(m => m.PostagemFormComponent),
    canActivate: [authGuard],
    title: 'Blogify - Nova Postagem'
  },
  {
    path: 'postagens/:id/editar',
    loadComponent: () => import('./pages/postagem-form/postagem-form.component').then(m => m.PostagemFormComponent),
    canActivate: [authGuard],
    title: 'Blogify - Editar Postagem'
  },
  {
    // leitura pública: qualquer pessoa pode abrir o link de uma postagem (editar e excluir seguem exigindo login)
    path: 'postagens/:id',
    loadComponent: () => import('./pages/postagem-detail/postagem-detail.component').then(m => m.PostagemDetailComponent),
    title: 'Blogify - Postagem'
  },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
