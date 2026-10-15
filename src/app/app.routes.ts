import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { saidaDoFormulario } from './guards/saida-do-formulario';
import { paraMeuPerfil } from './guards/meu-perfil';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Rasura - Página Inicial'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Rasura - Login'
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
    title: 'Rasura - Cadastro'
  },
  {
    path: 'esqueci-senha',
    loadComponent: () => import('./pages/esqueci-senha/esqueci-senha.component').then(m => m.EsqueciSenhaComponent),
    title: 'Rasura - Recuperar Senha'
  },
  {
    path: 'explorar',
    loadComponent: () => import('./pages/explorar/explorar.component').then(m => m.ExplorarComponent),
    title: 'Rasura - Mural'
  },

  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Rasura - Novidades'
  },
  {
    // atalho para a própria página: leva ao perfil de quem está logado (ou ao login, voltando depois)
    path: 'perfil',
    pathMatch: 'full',
    redirectTo: paraMeuPerfil('/perfil')
  },
  {
    // o perfil é uma página só, com as postagens da pessoa; público, sem guarda
    path: 'perfil/:id',
    loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent),
    title: 'Rasura - Perfil'
  },
  {
    // antiga "Minhas postagens": agora vive dentro do perfil
    path: 'postagens',
    pathMatch: 'full',
    redirectTo: paraMeuPerfil('/postagens')
  },
  {
    path: 'postagens/nova',
    loadComponent: () => import('./pages/postagem-form/postagem-form.component').then(m => m.PostagemFormComponent),
    canActivate: [authGuard],
    canDeactivate: [saidaDoFormulario],
    title: 'Rasura - Novo Rascunho'
  },
  {
    path: 'postagens/:id/editar',
    loadComponent: () => import('./pages/postagem-form/postagem-form.component').then(m => m.PostagemFormComponent),
    canActivate: [authGuard],
    canDeactivate: [saidaDoFormulario],
    title: 'Rasura - Editar Postagem'
  },
  {
    // leitura pública: qualquer pessoa pode abrir o link de uma postagem (editar e excluir seguem exigindo login)
    path: 'postagens/:id',
    loadComponent: () => import('./pages/postagem-detail/postagem-detail.component').then(m => m.PostagemDetailComponent),
    title: 'Rasura - Postagem'
  },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
