import { CommonModule, Location } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DashboardHeaderComponent } from './components/header-dashboard/dashboard-header.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { deveMostrarCabecalhoDoUsuario } from './shell/cabecalho';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, DashboardHeaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  /** Já nasce certo (pela URL do navegador), para não piscar o cabeçalho público até a 1ª navegação terminar. */
  showDashboardHeader = deveMostrarCabecalhoDoUsuario(inject(Location).path(), this.authService.isLoggedIn());

  constructor() {
    inject(ThemeService); // aplica o tema salvo assim que o app abre

    inject(Router)
      .events.pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(inject(DestroyRef))
      )
      .subscribe(evento => {
        this.showDashboardHeader = deveMostrarCabecalhoDoUsuario(evento.urlAfterRedirects, this.authService.isLoggedIn());
      });
  }
}
