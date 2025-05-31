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
  usuario!: Usuario & { fotoUrl?: string };

  constructor(private authService: AuthService) {}

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
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const id = this.usuario.id;

    this.authService.atualizarFoto(id, arquivo).subscribe({
      next: (res: any) => {
        this.usuario.fotoUrl = res.foto || this.usuario.fotoUrl;
        this.authService.updateUsuario(this.usuario);

        const urlCompleta = this.getFotoCompleta();
        console.log('URL completa da foto:', urlCompleta);
      },
      error: (err) => {
        console.error('Erro ao atualizar foto:', err);
      }
    });
  }
}
