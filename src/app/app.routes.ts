import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EsqueciSenhaComponent } from './pages/esqueci-senha/esqueci-senha.component';
import { AuthGuard } from './guards/auth.guard';
import { PostagemListComponent } from './components/postagem-list/postagem-list.component';
import { PostagemFormComponent } from './components/postagem-form/postagem-form.component';
import { PostagemDetailComponent } from './components/postagem-detail/postagem-detail.component';
import { PerfilComponent } from './components/perfil/perfil.component';
import { ExplorarComponent } from './components/explorar/explorar.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), title: 'Blogify - Página Inicial' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent), title: 'Blogify - Login' },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent), title: 'Blogify - Cadastro' },
  { path: 'esqueci-senha', loadComponent: () => import('./pages/esqueci-senha/esqueci-senha.component').then(m => m.EsqueciSenhaComponent), title: 'Blogify - Recuperar Senha' },

  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Blogify - Dashboard', canActivate: [AuthGuard] },

  { path: 'perfil', component: PerfilComponent },
  { path: 'explorar', component: ExplorarComponent },

  { path: 'postagens', loadComponent: () => import('./components/postagem-list/postagem-list.component').then(m => m.PostagemListComponent), canActivate: [AuthGuard], title: 'Blogify - Postagens' },
  { path: 'postagens/nova', loadComponent: () => import('./components/postagem-form/postagem-form.component').then(m => m.PostagemFormComponent), canActivate: [AuthGuard], title: 'Blogify - Nova Postagem' },
  // { path: 'postagens/:id', loadComponent: () => import('./components/postagem-form/postagem-form.component').then(m => m.PostagemFormComponent), canActivate: [AuthGuard], title: 'Blogify - Editar Postagem' },
  { path: 'postagens/:id', loadComponent: () => import('./components/postagem-detail/postagem-detail.component').then(m => m.PostagemDetailComponent), canActivate: [AuthGuard], title: 'Blogify - Detalhes da Postagem' },

  { path: '**', redirectTo: '', pathMatch: 'full' }
];
