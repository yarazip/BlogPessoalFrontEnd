import { Component, input, signal } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * Botão de olho para mostrar ou esconder a senha de um campo. Fica dentro de um `.campo-senha` (ver styles.scss), ao
 * lado do input, e recebe o próprio <input> para trocar o tipo entre "password" e "text":
 *
 *     <div class="campo-senha">
 *       <input #senha type="password" formControlName="senha" />
 *       <app-mostrar-senha [campo]="senha" />
 *     </div>
 *
 * O botão não tira o foco do campo (mousedown é cancelado) e avisa o estado a leitores de tela (aria-pressed).
 */
@Component({
  selector: 'app-mostrar-senha',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './mostrar-senha.component.html',
  styleUrls: ['./mostrar-senha.component.scss']
})
export class MostrarSenhaComponent {
  readonly campo = input.required<HTMLInputElement>();

  readonly visivel = signal(false);

  alternar(): void {
    this.visivel.update(v => !v);
    this.campo().type = this.visivel() ? 'text' : 'password';
  }
}
