import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);
  private authService = inject(AuthService);

  // กำหนดค่าเริ่มต้นจาก URL ปัจจุบันทันที เพื่อป้องกัน sidebar flash ก่อน NavigationEnd
  isLoginPage: boolean = typeof window !== 'undefined'
    ? window.location.pathname.startsWith('/login')
    : false;
  isNavigating: boolean = false;
  isMobileMenuOpen: boolean = false;
  private navTimer: any;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (event instanceof NavigationEnd) {
          this.isLoginPage = event.urlAfterRedirects.startsWith('/login');
          this.isMobileMenuOpen = false; // ปิดเมนูบนมือถืออัตโนมัติเมื่อเปลี่ยนหน้า
        }
        clearTimeout(this.navTimer);
        this.navTimer = setTimeout(() => {
          this.isNavigating = false;
        }, 260);
      }
    });
  }

  // Effect ลูกเล่นคลื่นน้ำ (Ripple Wave) และ Micro-interaction เมื่อกดคลิกปุ่มหรือเมนู
  @HostListener('document:click', ['$event'])
  onGlobalClick(e: MouseEvent) {
    const target = (e.target as HTMLElement).closest(
      '.btn, .sidebar-nav-item, .sidebar-subnav-item, .sidebar-logout, .menu-option-btn, .custom-dropdown-btn'
    ) as HTMLElement;

    if (!target) return;

    const rect = target.getBoundingClientRect();
    const circle = document.createElement('span');
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add('interactive-ripple-wave');

    const existing = target.getElementsByClassName('interactive-ripple-wave')[0];
    if (existing) {
      existing.remove();
    }

    target.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  }
}
