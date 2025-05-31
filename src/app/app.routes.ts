import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PerfilComponent } from './components/perfil/perfil.component';
import { ExplorarComponent } from './components/explorar/explorar.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Blogify - Página Inicial' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent), title: 'Blogify - Login' },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent), title: 'Blogify - Cadastro' },
  { path: 'esqueci-senha', loadComponent: () => import('./pages/esqueci-senha/esqueci-senha.component').then(m => m.EsqueciSenhaComponent), title: 'Blogify - Recuperar Senha' },

  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Blogify - Dashboard', canActivate: [AuthGuard] },

  { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard] },
  { path: 'explorar', component: ExplorarComponent },

  { path: 'postagens', loadComponent: () => import('./components/postagem-list/postagem-list.component').then(m => m.PostagemListComponent), title: 'Blogify - Postagens', canActivate: [AuthGuard] },

  { path: 'postagens/nova', loadComponent: () => import('./components/postagem-form/postagem-form.component').then(m => m.PostagemFormComponent), title: 'Blogify - Nova Postagem', canActivate: [AuthGuard] },

  { path: 'postagens/editar/:id', loadComponent: () => import('./components/postagem-form/postagem-form.component').then(m => m.PostagemFormComponent), title: 'Blogify - Editar Postagem', canActivate: [AuthGuard] },

  { path: 'postagens/detalhes/:id', loadComponent: () => import('./components/postagem-detail/postagem-detail.component').then(m => m.PostagemDetailComponent), title: 'Blogify - Detalhes da Postagem', canActivate: [AuthGuard] },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
