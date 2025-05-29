import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  submitted = false;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, {
      validator: this.passwordMatchValidator
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  passwordMatchValidator(formGroup: AbstractControl) {
    const senha = formGroup.get('senha');
    const confirmPassword = formGroup.get('confirmPassword');

    if (!senha || !confirmPassword) return null;

    if (confirmPassword.errors && !confirmPassword.errors['mismatch']) {
      return null;
    }

    if (senha.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      confirmPassword.setErrors(null);
    }

    return null;
  }
onSubmit() {
  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  const { nome, email, senha } = this.registerForm.value;
  this.isLoading = true;
  this.errorMessage = null;

  this.authService.register(nome, email, senha).subscribe({
    next: () => {
      this.router.navigate(['/login']);
    },
    error: (error) => {
      this.isLoading = false;
      console.error('Erro ao cadastrar:', error);

      if (error.status === 409) {
        this.errorMessage = error.error.message || 'Email já está em uso';
      } else {
        this.errorMessage = 'O e-mail já está em uso';
      }
    }
  });
}

}