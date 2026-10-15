import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models/Usuario';

export type { Usuario } from '../models/Usuario';

export interface UsuarioResponse {
  id: number;
  nome: string;
  email: string;
  token: string;
  foto?: string;
  admin?: boolean;
}

export interface UsuarioLogin {
  email: string;
  senha: string;
}

const TOKEN_KEY = 'token';
const USUARIO_KEY = 'usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly authUrl = `${environment.apiUrl}/auth`;
  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;

  login(credenciais: UsuarioLogin): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.authUrl}/login`, credenciais);
  }

  register(nome: string, email: string, senha: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.authUrl}/register`, { nome, email, senha });
  }

  /** Pede o link de redefinição por e-mail. A API responde igual exista ou não a conta. */
  esqueciSenha(email: string): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/esqueci-senha`, { email });
  }

  /** Troca a senha com o token que veio no link do e-mail. */
  redefinirSenha(token: string, senha: string): Observable<void> {
    return this.http.post<void>(`${this.authUrl}/redefinir-senha`, { token, senha });
  }

  atualizarFoto(id: number, arquivoFoto: File): Observable<{ foto: string }> {
    const formData = new FormData();
    formData.append('foto', arquivoFoto);
    return this.http.put<{ foto: string }>(`${this.usuariosUrl}/${id}/foto`, formData);
  }

  /** Guarda a sessão. O token chega como "Bearer xxx" e é salvo sem o prefixo. */
  saveAuthData(usuario: UsuarioResponse): void {
    const token = usuario.token.startsWith('Bearer ') ? usuario.token.substring(7) : usuario.token;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(
      USUARIO_KEY,
      JSON.stringify({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        foto: usuario.foto ?? '',
        admin: usuario.admin ?? false
      })
    );
  }

  getUsuario(): Usuario | null {
    const salvo = localStorage.getItem(USUARIO_KEY);
    if (!salvo) {
      return null;
    }
    try {
      return JSON.parse(salvo) as Usuario;
    } catch {
      localStorage.removeItem(USUARIO_KEY);
      return null;
    }
  }

  /** Mostra ou esconde as ações de administrador na tela; quem barra de verdade é a API (403). */
  isAdmin(): boolean {
    return this.getUsuario()?.admin === true;
  }

  updateUsuario(parcial: Partial<Usuario>): void {
    const atual = this.getUsuario();
    if (atual) {
      localStorage.setItem(USUARIO_KEY, JSON.stringify({ ...atual, ...parcial }));
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Há sessão se existir um token que ainda não expirou. Token vencido ou ilegível é descartado. */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    if (this.tokenExpirado(token)) {
      this.limparSessao();
      return false;
    }
    return true;
  }

  logout(): void {
    this.limparSessao();
    this.router.navigate(['/login']);
  }

  /** Chamado quando a API responde 401 a uma requisição autenticada. */
  sessaoExpirada(): void {
    this.limparSessao();
    this.router.navigate(['/login'], { queryParams: { expirada: 1 } });
  }

  private limparSessao(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  }

  private tokenExpirado(token: string): boolean {
    try {
      const { exp } = jwtDecode<{ exp?: number }>(token);
      return exp !== undefined && exp * 1000 <= Date.now();
    } catch {
      return true; // token malformado
    }
  }
}
