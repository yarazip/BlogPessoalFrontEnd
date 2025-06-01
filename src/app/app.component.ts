import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DashboardHeaderComponent } from './components/header-dashboard/dashboard-header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    DashboardHeaderComponent,
    RouterOutlet,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'blogify';
  showDashboardHeader = false;
  showDefaultHeader = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {

        const url = (event.urlAfterRedirects || event.url).split('?')[0].split('#')[0];

        const publicRoutes = ['/login', '/register', '/esqueci-senha'];  // Rotas públicas
        const dashboardRoutes = ['/home', '/postagens', '/perfil'];      // Rotas protegidas

        if (dashboardRoutes.some(route => url.startsWith(route))) {
          this.showDashboardHeader = true;
          this.showDefaultHeader = false;
        } else if (publicRoutes.some(route => url.startsWith(route))) {
          this.showDashboardHeader = false;
          this.showDefaultHeader = true;
        } else {
          // Padrão (404 ou outros casos não previstos)
          this.showDashboardHeader = false;
          this.showDefaultHeader = true;
        }
      });
  }
}
