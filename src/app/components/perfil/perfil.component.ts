import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  usuario!: Usuario & { bio?: string; fotoUrl?: string };
  editandoBio = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getUsuario();
    if (user) {
      this.usuario = { ...user };
    }
  }

  toggleEditarBio() {
    if (this.editandoBio) {
      this.salvarBio();
    }
    this.editandoBio = !this.editandoBio;
  }

  salvarBio() {
    const formData = new FormData();
    formData.append('bio', this.usuario.bio || '');

    this.authService.atualizarUsuario(this.usuario.id, formData).subscribe({
      next: (res: any) => {
        console.log('Bio atualizada com sucesso');
        this.usuario = { ...this.usuario, bio: res.bio };
        this.authService.updateUsuario(this.usuario);
      },
      error: (err) => console.error('Erro ao atualizar bio:', err)
    });
  }
 
getFotoCompleta(): string {
  if (!this.usuario?.fotoUrl) return '';
  if (this.usuario.fotoUrl.startsWith('http')) {
    return this.usuario.fotoUrl;
  }
  return environment.apiUrl.replace('/api', '') + this.usuario.fotoUrl;
}

  onFileSelected(event: any) {
    const arquivo = event.target.files[0];
    const bio = this.usuario.bio || '';
    const id = this.usuario.id;

  this.authService.atualizarPerfil(id, arquivo, bio).subscribe({
  next: (res: any) => {
    console.log('Resposta backend:', res);  // veja exatamente o que retorna
    this.usuario = {
      ...this.usuario,
      fotoUrl: res.fotoUrl || res.foto || this.usuario.fotoUrl,
      bio: res.bio || this.usuario.bio
    };
    this.authService.updateUsuario(this.usuario);
  },
  error: (err) => {
    console.error('Erro ao atualizar perfil:', err);
  }
});
  }
}
