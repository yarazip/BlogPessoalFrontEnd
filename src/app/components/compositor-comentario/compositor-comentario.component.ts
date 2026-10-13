import { Component, inject, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LIMITE_COMENTARIO, Postagem } from '../../models/Postagem';
import { AuthService } from '../../services/auth.service';
import { PostagemService } from '../../services/postagem.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/** Caixa para publicar um comentário (texto curto, sem título) direto do feed. */
@Component({
  selector: 'app-compositor-comentario',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './compositor-comentario.component.html',
  styleUrls: ['./compositor-comentario.component.scss']
})
export class CompositorComentarioComponent {
  private readonly postagemService = inject(PostagemService);
  private readonly authService = inject(AuthService);

  /** Emite a postagem criada, para o feed colocá-la no topo. */
  readonly publicado = output<Postagem>();

  readonly limite = LIMITE_COMENTARIO;
  readonly fotoPadrao = 'assets/img/sem-foto.svg';
  readonly foto = this.authService.getUsuario()?.foto || this.fotoPadrao;

  // mesmo limite validado pela API; o <form> precisa de um FormGroup para o Angular barrar o envio nativo
  readonly texto = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_COMENTARIO)] });
  readonly form = new FormGroup({ texto: this.texto });

  enviando = false;
  erro: string | null = null;

  get restantes(): number {
    return this.limite - this.texto.value.length;
  }

  /** O botão fica desligado com o campo vazio (ou só com espaços), passando do limite ou enviando. */
  get podePublicar(): boolean {
    return !this.enviando && this.texto.value.trim().length > 0 && this.texto.valid;
  }

  publicar(): void {
    if (!this.podePublicar) {
      return;
    }

    this.enviando = true;
    this.erro = null;

    this.postagemService.create({ tipo: 'COMENTARIO', texto: this.texto.value.trim() }).subscribe({
      next: postagem => {
        this.texto.reset();
        this.enviando = false;
        this.publicado.emit(postagem);
      },
      error: erro => {
        this.erro = mensagemDeErro(erro, 'Não foi possível publicar. Tente novamente.');
        this.enviando = false;
      }
    });
  }
}
