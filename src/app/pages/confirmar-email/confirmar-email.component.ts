import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';

type Estado = 'confirmando' | 'confirmado' | 'erro';

/**
 * Tela do link do e-mail ("/confirmar-email?token=..."): confirma o endereço assim que abre. Não pede nada à pessoa;
 * se o link estiver vencido ou já usado, explica e leva ao login (de lá dá para pedir outro).
 */
@Component({
  selector: 'app-confirmar-email',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './confirmar-email.component.html',
  styleUrls: ['../esqueci-senha/esqueci-senha.component.scss']
})
export class ConfirmarEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  estado: Estado = 'confirmando';
  errorMessage: string | null = null;

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.falhar('Este endereço não tem o código do e-mail. Entre com seu e-mail e senha para pedir um novo link.');
      return;
    }

    this.authService.confirmarEmail(token).subscribe({
      next: () => (this.estado = 'confirmado'),
      error: erro => this.falhar(mensagemDeErro(erro, 'Não foi possível confirmar o e-mail. Tente novamente.'))
    });
  }

  private falhar(mensagem: string): void {
    this.estado = 'erro';
    this.errorMessage = mensagem;
  }
}
