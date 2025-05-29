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

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }


  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
const urlWithFragment = event.urlAfterRedirects || event.url;
const url = urlWithFragment.split('?')[0].split('#')[0];
        
        const defaultHeaderRoutes = ['/', '/home', '/login', '/register'];
        
        this.showDashboardHeader = !defaultHeaderRoutes.some(route => 
          url === route || url.startsWith(route + '/')
        ); 
      });
  }
}