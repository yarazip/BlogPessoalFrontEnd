
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthService } from '../../services/auth.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

/** Marca "mismatch" no grupo quando a confirmação não confere com a senha. */
function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const senha = grupo.get('senha')?.value;
  const confirmacao = grupo.get('confirmPassword')?.value;
  return senha === confirmacao ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // limites da API: nome até 100, senha de 8 a 72 caracteres
  readonly registerForm = this.fb.nonNullable.group(
    {
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: senhasIguais }
  );

  submitted = false;
  isLoading = false;
  errorMessage: string | null = null;

  get f() {
    return this.registerForm.controls;
  }

  /** A confirmação só é "diferente" depois que o usuário mexeu nela. */
  get senhasDiferentes(): boolean {
    return this.registerForm.hasError('mismatch') && this.f.confirmPassword.touched;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { nome, email, senha } = this.registerForm.getRawValue();
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.register(nome, email, senha).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: erro => {
        this.isLoading = false;
        this.errorMessage = mensagemDeErro(erro, 'Ocorreu um erro ao cadastrar. Tente novamente mais tarde.');
      }
    });
  }
}
