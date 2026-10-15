import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/**
 * Pede o link de redefinição por e-mail. Depois do pedido a tela sempre diz a mesma coisa ("se existir uma conta..."),
 * porque a API também responde igual: assim ninguém descobre quem tem cadastro.
 */
@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './esqueci-senha.component.html',
  styleUrls: ['./esqueci-senha.component.scss']
})
export class EsqueciSenhaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]]
  });

  submitted = false;
  isLoading = false;
  /** O e-mail digitado, para repetir na confirmação. */
  enviadoPara: string | null = null;
  errorMessage: string | null = null;

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (this.form.invalid) {
      return;
    }

    const email = this.form.getRawValue().email.trim();
    this.isLoading = true;

    this.authService.esqueciSenha(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.enviadoPara = email;
      },
      error: erro => {
        this.isLoading = false;
        this.errorMessage = mensagemDeErro(erro, 'Não foi possível enviar o e-mail. Tente novamente.');
      }
    });
  }
}
