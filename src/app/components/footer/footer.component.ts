import { Component } from '@angular/core';
import { IconComponent } from '../../shared/icon/icon.component';
import { LogoComponent } from '../../shared/logo/logo.component';
import { IconName } from '../../shared/icon/icon-names';

interface LinkDeContato {
  rotulo: string;
  url: string;
  icone: IconName;
  externo: boolean;
}

@Component({
  selector: 'app-footer',
  imports: [IconComponent, LogoComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  readonly ano = new Date().getFullYear();

  readonly links: readonly LinkDeContato[] = [
    { rotulo: 'GitHub', url: 'https://github.com/yarazip', icone: 'github', externo: true },
    { rotulo: 'LinkedIn', url: 'https://www.linkedin.com/in/yara-rosa-dev', icone: 'linkedin', externo: true },
    { rotulo: 'E-mail', url: 'mailto:yaradev@gmail.com', icone: 'envelope', externo: false }
  ];
}
