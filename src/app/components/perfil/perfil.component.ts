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
      // this.salvarBio();
    }
    this.editandoBio = !this.editandoBio;
  }

//  salvarBio() {
//   this.authService.atualizarUsuario(this.usuario.id, { bio: this.usuario.bio })
//     .subscribe({
//       next: (res: any) => {
//         console.log('Bio atualizada com sucesso');
//         this.usuario = { ...this.usuario, bio: res.bio };
//         this.authService.updateUsuario(this.usuario);
//       },
//       error: (err) => console.error('Erro ao atualizar bio:', err)
//     });
// }

getFotoCompleta(): string {
  return this.usuario.fotoUrl || '';
}

onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (file) {
    this.authService.atualizarFoto(this.usuario.id, file)
      .subscribe({
        next: (res) => {
          console.log('Foto atualizada', res);
          this.usuario.fotoUrl = res.foto; 
          
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
