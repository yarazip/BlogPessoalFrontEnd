import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DashboardHeaderComponent } from './components/header-dashboard/dashboard-header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

/** Páginas abertas a visitantes: nelas o cabeçalho é sempre o público. */
const ROTAS_PUBLICAS = ['/', '/login', '/register', '/esqueci-senha', '/explorar'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, DashboardHeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  showDashboardHeader = false;

  constructor() {
    inject(ThemeService); // aplica o tema salvo assim que o app abre

    inject(Router)
      .events.pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe(evento => {
        const caminho = evento.urlAfterRedirects.split(/[?#]/)[0];
        const publica = ROTAS_PUBLICAS.includes(caminho);
        this.showDashboardHeader = this.authService.isLoggedIn() && !publica;
      });
  }
}
