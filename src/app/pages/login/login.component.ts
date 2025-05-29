import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  submitted = false;
  isLoading = false;
  loginError = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.loginError = false;
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    const { email, senha } = this.loginForm.value;
this.authService.login({ email, senha }).subscribe({
  next: (response) => {
    console.log('Login bem-sucedido:', response);
    this.authService.saveAuthData(response);  
    this.router.navigate(['/dashboard']);
    this.isLoading = false;
  },
      error: (err) => {
        console.error('Erro no login:', err);
        this.loginError = true;
        this.errorMessage = 'E-mail ou senha inválidos!';
        this.isLoading = false;
      }
    });
  }
}
