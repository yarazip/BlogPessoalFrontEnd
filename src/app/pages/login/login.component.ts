
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo.component';
import { AuthService } from '../../services/auth.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required]
  });

  submitted = false;
  isLoading = false;
  loginError = false;
  errorMessage: string | null = null;
  /** Aviso de sucesso (ex.: acabou de trocar a senha). */
  aviso: string | null = null;

  get f() {
    return this.loginForm.controls;
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.has('senhaTrocada')) {
      this.aviso = 'Senha trocada! Entre com a nova senha.';
    }
    if (this.route.snapshot.queryParamMap.has('expirada')) {
      this.mostrarErro('Sua sessão expirou. Entre novamente para continuar.');
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.loginError = false;
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: resposta => {
        this.authService.saveAuthData(resposta);
        this.isLoading = false;
        this.router.navigateByUrl(this.destinoAposLogin());
      },
      error: erro => {
        this.isLoading = false;
        if (erro?.status === 403) {
          // senha certa, e-mail ainda sem confirmar: leva à tela que explica e oferece o reenvio do link
          this.router.navigate(['/confirme-seu-email'], { state: { email: this.loginForm.getRawValue().email, daEntrada: true } });
          return;
        }
        this.mostrarErro(
          erro?.status === 401 ? 'E-mail ou senha inválidos!' : mensagemDeErro(erro, 'Não foi possível entrar. Tente novamente.')
        );
      }
    });
  }

  /** Volta para a página que exigiu login, aceitando apenas caminhos internos do app. */
  private destinoAposLogin(): string {
    const retorno = this.route.snapshot.queryParamMap.get('returnUrl');
    return retorno && retorno.startsWith('/') && !retorno.startsWith('//') ? retorno : '/explorar';
  }

  private mostrarErro(mensagem: string): void {
    this.loginError = true;
    this.errorMessage = mensagem;
  }
}
