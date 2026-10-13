import { IconComponent } from '../../shared/icon/icon.component';

import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LIMITE_BIO } from '../../models/Perfil';
import { AuthService, Usuario } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/** Formatos aceitos pela API (SVG fica de fora de propósito: pode conter scripts). */
export const TIPOS_FOTO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [IconComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly perfilService = inject(PerfilService);

  readonly limiteBio = LIMITE_BIO;
  // mesmo limite validado pela API (BioRequestDTO); texto vazio apaga a bio
  readonly bio = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_BIO)] });
  // o <form> precisa de um FormGroup: é ele que faz o Angular impedir o envio nativo (recarregar a página)
  readonly bioForm = new FormGroup({ bio: this.bio });

  usuario: Usuario | null = null;
  enviando = false;
  mensagemErro: string | null = null;
  salvandoBio = false;
  bioSalva = false;
  erroBio: string | null = null;

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.carregarBio();
  }

  /** A bio não fica na sessão (localStorage); vem do perfil público. Se falhar, o campo fica vazio. */
  private carregarBio(): void {
    if (!this.usuario) {
      return;
    }
    this.perfilService.getPerfil(this.usuario.id).subscribe({
      next: perfil => this.bio.setValue(perfil.bio ?? ''),
      error: () => this.bio.setValue('')
    });
  }

  salvarBio(): void {
    if (!this.usuario || this.bio.invalid || this.salvandoBio) {
      return;
    }

    this.salvandoBio = true;
    this.bioSalva = false;
    this.erroBio = null;

    this.perfilService.atualizarBio(this.usuario.id, this.bio.value).subscribe({
      next: perfil => {
        this.bio.setValue(perfil.bio ?? '');
        this.bio.markAsPristine();
        this.bioSalva = true;
        this.salvandoBio = false;
      },
      error: erro => {
        this.erroBio = mensagemDeErro(erro, 'Não foi possível salvar a bio. Tente novamente.');
        this.salvandoBio = false;
      }
    });
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
