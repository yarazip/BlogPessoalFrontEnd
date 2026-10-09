import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AuthService, Usuario } from '../../services/auth.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/** Formatos aceitos pela API (SVG fica de fora de propósito: pode conter scripts). */
export const TIPOS_FOTO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [NgIf],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  private readonly authService = inject(AuthService);

  usuario: Usuario | null = null;
  enviando = false;
  mensagemErro: string | null = null;

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
  }

  onFileSelected(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const arquivo = entrada.files?.[0];
    entrada.value = ''; // permite escolher o mesmo arquivo de novo depois de um erro
    this.mensagemErro = null;

    if (!arquivo || !this.usuario) {
      return;
    }
    if (!TIPOS_FOTO_PERMITIDOS.includes(arquivo.type)) {
      this.mensagemErro = 'Formato não suportado. Envie JPG, PNG, WEBP, GIF ou AVIF.';
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      this.mensagemErro = 'Arquivo muito grande. O tamanho máximo permitido é 5MB.';
      return;
    }

    this.enviando = true;
    this.authService.atualizarFoto(this.usuario.id, arquivo).subscribe({
      next: resposta => {
        this.usuario = { ...this.usuario!, foto: resposta.foto };
        this.authService.updateUsuario({ foto: resposta.foto });
        this.enviando = false;
      },
      error: erro => {
        this.mensagemErro = mensagemDeErro(erro, 'Não foi possível atualizar a foto. Tente novamente.');
        this.enviando = false;
      }
    });
  }
}
