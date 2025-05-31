import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, Usuario } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  usuario!: Usuario & { bio?: string; foto?: string };
  editandoBio = false;

  constructor(private authService: AuthService) {}

ngOnInit(): void {
  const user = this.authService.getUsuario();
  if (user) {
    this.authService.getUsuarioById(user.id).subscribe({
      next: (dados) => {
        this.usuario = dados;
      },
      error: (err) => console.error('Erro ao carregar usuário:', err)
    });
  }
}



  toggleEditarBio() {
    this.editandoBio = !this.editandoBio;
  }

  // getFotoCompleta(): string {
  //   return this.usuario.foto || '';
  // }
onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Formato inválido. Envie uma imagem JPG, PNG ou WEBP.');
      return;
    }

    this.authService.atualizarFoto(this.usuario.id, file)
      .subscribe({
        next: (res) => {
          console.log('Foto atualizada', res);
          this.usuario = { ...this.usuario, foto: res.foto };
          this.authService.updateUsuario({ foto: res.foto });
        },
        error: (err) => {
          console.error('Erro ao atualizar foto:', err);
          alert('Erro ao atualizar foto');
        }
      });
  }
}

}
