import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/**
 * "Falta confirmar o e-mail": aparece logo depois do cadastro e quando alguém tenta entrar com a conta ainda sem
 * confirmar. Explica o que fazer e deixa pedir outro link. O e-mail chega pelo estado da navegação (nunca pela URL);
 * se a página for aberta direto, pede o e-mail para o reenvio.
 */
@Component({
  selector: 'app-confirme-seu-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './confirme-seu-email.component.html',
  styleUrls: ['../esqueci-senha/esqueci-senha.component.scss']
})
export class ConfirmeSeuEmailComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  /** E-mail da conta, quando veio da navegação. */
  readonly email: string | null = typeof history.state?.email === 'string' ? history.state.email : null;
  /** Veio da tela de entrada (conta antiga ou nova que ainda não confirmou), e não de um cadastro agora. */
  readonly daEntrada: boolean = history.state?.daEntrada === true;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]]
  });

  submitted = false;
  isLoading = false;
  reenviado = false;
  errorMessage: string | null = null;

  get f() {
    return this.form.controls;
  }

  reenviar(): void {
    this.submitted = true;
    this.errorMessage = null;

    const destino = this.email ?? this.form.getRawValue().email.trim();
    if (!this.email && this.form.invalid) {
      return;
    }

    this.isLoading = true;
    this.authService.reenviarConfirmacao(destino).subscribe({
      next: () => {
        this.isLoading = false;
        this.reenviado = true;
      },
      error: erro => {
        this.isLoading = false;
        this.errorMessage = mensagemDeErro(erro, 'Não foi possível enviar o e-mail. Tente novamente.');
      }
    });
  }
}
