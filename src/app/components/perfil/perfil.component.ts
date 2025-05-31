import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, Usuario } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  usuario!: Usuario & { fotoUrl?: string };

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    const user = this.authService.getUsuario();
    if (user) {
      this.usuario = { ...user };
    }
  }

  getFotoCompleta(): string {
    if (!this.usuario?.fotoUrl) return '';
    if (this.usuario.fotoUrl.startsWith('http')) return this.usuario.fotoUrl;
    return environment.apiUrl.replace('/api', '') + this.usuario.fotoUrl;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && this.usuario?.id) {
      const formData = new FormData();
      formData.append('foto', file);

      this.http.put<{ foto: string }>(`${environment.apiUrl}/usuarios/${this.usuario.id}/foto`, formData)
        .subscribe({
          next: (response) => {
            console.log('Foto atualizada com sucesso', response);
            this.usuario.fotoUrl = response.foto;
          },
          error: (error) => {
            console.error('Erro ao atualizar foto:', error);
          }
        });
    }
  }
}
