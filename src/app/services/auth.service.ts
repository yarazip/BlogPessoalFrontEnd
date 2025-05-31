import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment'; 


export interface UsuarioResponse {
  id: number;
  nome: string;
  email: string;
  token: string;
}

export interface UsuarioLogin {
  email: string;
  senha: string;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  
  private baseUrl = `${environment.apiUrl}/usuarios`;
private apiUrl = `${environment.apiUrl}/auth`;

private readonly TOKEN_KEY = 'token';

  constructor(private http: HttpClient, private router: Router) {}


  login(usuarioLogin: UsuarioLogin): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.apiUrl}/login`, usuarioLogin);
  }

  register(nome: string, email: string, senha: string): Observable<HttpResponse<any>> {
    const body = { nome, email, senha, foto: '' };
    return this.http.post<any>(`${this.apiUrl}/register`, body, { observe: 'response' });
  }

  getUsuarioById(id: number) {
    return this.http.get<Usuario>(`${this.baseUrl}/${id}`);
  }

  atualizarUsuario(id: number, formData: FormData): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/${id}`, formData);
  }

  forgotPassword(email: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/forgot-password`, { email });
}

atualizarFoto(id: number, arquivoFoto: File) {
  const formData = new FormData();
  formData.append('foto', arquivoFoto);
  return this.http.put<{ foto: string }>(`${this.baseUrl}/${id}/foto`, formData);
}


saveAuthData(usuario: UsuarioResponse): void {
  const cleanToken = usuario.token.startsWith('Bearer ') 
    ? usuario.token.substring(7) 
    : usuario.token;
  localStorage.setItem('token', cleanToken);
  localStorage.setItem('usuario', JSON.stringify({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email
  }));
}


  getUsuario(): Usuario | null {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  getCurrentUserId(): string | null {
    const usuario = this.getUsuario();
    return usuario ? usuario.id.toString() : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
updateUsuario(usuario: Partial<Usuario> & { foto?: string }): void {
  const current = this.getUsuario();
  if (current) {
    const updated = { ...current, ...usuario };
    localStorage.setItem('usuario', JSON.stringify(updated));
  }
}

}