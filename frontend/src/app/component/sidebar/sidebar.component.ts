import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private routerSub: Subscription | null = null;

  @Input() isOpen: boolean = true;
  @Input() isMobileOpen: boolean = false;
  @Output() closeMobile = new EventEmitter<void>();

  isAdmissionOpen: boolean = false;
  currentUser: string = 'ผู้ใช้งาน';
  userInitials: string = 'RU';
  showLogoutModal: boolean = false;
  isClosingLogoutModal: boolean = false;

  @HostListener('document:keydown.escape')
  onEscapePress() {
    if (this.showLogoutModal && !this.isClosingLogoutModal) {
      this.closeLogoutModal();
    }
  }

  ngOnInit() {
    this.loadUserData();

    // ตรวจสอบ URL ตอนโหลดหรือรีเฟรชหน้า
    this.checkRouteAndCollapse(this.router.url);

    // ติดตามการเปลี่ยนหน้า เพื่อเปิด/หุบอัตโนมัติตาม URL
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkRouteAndCollapse(event.urlAfterRedirects || event.url);
      this.loadUserData();
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;
      // คำนวณตัวย่อสำหรับ Avatar
      const cleanName = user.split('@')[0];
      const parts = cleanName.split(/[._-]/);
      if (parts.length > 1 && parts[0] && parts[1]) {
        this.userInitials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        this.userInitials = cleanName.substring(0, 2).toUpperCase();
      }
    } else {
      this.currentUser = 'ผู้ใช้งาน';
      this.userInitials = 'RU';
    }
  }

  private checkRouteAndCollapse(url: string) {
    if (url && (url.includes('/reports/central') || url.includes('/reports/regional'))) {
      this.isAdmissionOpen = true;
    } else {
      this.isAdmissionOpen = false;
    }
  }

  toggleAdmissionMenu() {
    this.isAdmissionOpen = !this.isAdmissionOpen;
  }

  openLogoutModal() {
    this.isClosingLogoutModal = false;
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    if (this.isClosingLogoutModal) return;
    this.isClosingLogoutModal = true;
    setTimeout(() => {
      this.showLogoutModal = false;
      this.isClosingLogoutModal = false;
    }, 200);
  }

  confirmLogout() {
    // รอ animation ปิด modal ก่อนแล้วค่อย logout
    this.closeLogoutModal();
    setTimeout(() => {
      this.closeMobile.emit();
      this.authService.logout();
      this.router.navigate(['/login']);
    }, 220);
  }
}
