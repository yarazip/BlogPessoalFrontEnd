import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { MostrarSenhaComponent } from '../../shared/mostrar-senha/mostrar-senha.component';

/** Marca "mismatch" no grupo quando a confirmação não confere com a senha. */
function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  return grupo.get('senha')?.value === grupo.get('confirmacao')?.value ? null : { mismatch: true };
}

/**
 * Tela do link do e-mail ("/redefinir-senha?token=..."): escolhe a nova senha. Depois de trocar, a pessoa vai para o
 * login (a senha antiga já não vale). O token vai só no corpo da requisição, nunca é guardado nem repetido na tela.
 */
@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MostrarSenhaComponent],
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['../esqueci-senha/esqueci-senha.component.scss']
})
export class RedefinirSenhaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // mesmos limites do cadastro: de 8 a 72 caracteres
  readonly form = this.fb.nonNullable.group(
    {
      senha: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmacao: ['', Validators.required]
    },
    { validators: senhasIguais }
  );

  token: string | null = null;
  submitted = false;
  isLoading = false;
  errorMessage: string | null = null;

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (this.form.invalid || !this.token) {
      return;
    }

    this.isLoading = true;

    this.authService.redefinirSenha(this.token, this.form.getRawValue().senha).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login'], { queryParams: { senhaTrocada: 1 } });
      },
      error: erro => {
        this.isLoading = false;
        this.errorMessage = mensagemDeErro(erro, 'Não foi possível trocar a senha. Tente novamente.');
      }
    });
  }
}
