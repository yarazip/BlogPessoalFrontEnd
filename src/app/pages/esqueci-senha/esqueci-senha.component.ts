import { IconComponent } from '../../shared/icon/icon.component';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Recuperação de senha ainda não existe na API: a página apenas informa isso. */
@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './esqueci-senha.component.html',
  styleUrls: ['./esqueci-senha.component.scss']
})
export class EsqueciSenhaComponent {}
