import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LIMITE_HUMOR } from '../../models/Perfil';
import { PerfilService } from '../../services/perfil.service';
import { mensagemDeErro } from '../../shared/mensagem-de-erro';
import { TextoComEmojisComponent } from '../texto-com-emojis/texto-com-emojis.component';

/**
 * O "humor do dia" do perfil: uma frase curta ("sonolenta, mas feliz"), mostrada para todo mundo e editável só pela
 * dona. Aceita os emojis da Rasura (`:sol:`). Texto vazio apaga o humor.
 *
 *     <app-humor-do-dia [perfilId]="perfil.id" [humor]="perfil.humor" [ehDona]="ehOProprioPerfil" (atualizado)="..." />
 */
@Component({
  selector: 'app-humor-do-dia',
  standalone: true,
  imports: [ReactiveFormsModule, TextoComEmojisComponent],
  templateUrl: './humor-do-dia.component.html',
  styleUrls: ['./humor-do-dia.component.scss']
})
export class HumorDoDiaComponent {
  private readonly perfilService = inject(PerfilService);

  readonly perfilId = input.required<number>();
  readonly humor = input<string | null | undefined>(null);
  readonly ehDona = input(false);

  /** O humor salvo (nulo quando foi apagado). */
  readonly atualizado = output<string | null>();

  readonly limite = LIMITE_HUMOR;
  readonly campo = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(LIMITE_HUMOR)] });
  // o <form> precisa de um FormGroup: é ele que faz o Angular impedir o envio nativo (recarregar a página)
  readonly formulario = new FormGroup({ humor: this.campo });

  editando = false;
  salvando = false;
  erro: string | null = null;

  editar(): void {
    this.campo.setValue(this.humor() ?? '');
    this.erro = null;
    this.editando = true;
  }

  cancelar(): void {
    this.editando = false;
    this.erro = null;
  }

  salvar(): void {
    if (this.campo.invalid || this.salvando) {
      return;
    }
    this.salvando = true;
    this.erro = null;

    this.perfilService.atualizarHumor(this.perfilId(), this.campo.value).subscribe({
      next: perfil => {
        this.salvando = false;
        this.editando = false;
        this.atualizado.emit(perfil.humor ?? null);
      },
      error: erro => {
        this.salvando = false;
        this.erro = mensagemDeErro(erro, 'Não foi possível salvar o humor. Tente novamente.');
      }
    });
  }
}
