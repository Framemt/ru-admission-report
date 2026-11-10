import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirebaseAuthService } from '../../services/firebase-auth.service';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private firebaseAuth = inject(FirebaseAuthService);

  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  isLoading: boolean = false;
  isGoogleLoading: boolean = false;
  errorMessage: string = '';

  // State สำหรับลงทะเบียน / แจ้งเตือนเมื่อยังไม่มีข้อมูลใน MySQL
  showUnauthorizedModal: boolean = false;
  unauthorizedEmail: string = '';
  unauthorizedDisplayName: string = '';
  unauthorizedMessage: string = '';
  isRegisteringGoogle: boolean = false;

  // State สำหรับฟอร์มสมัครสมาชิก (Register Mode)
  isRegisterMode: boolean = false;
  regUsername: string = '';
  regPassword: string = '';
  regConfirmPassword: string = '';
  showRegPassword: boolean = false;

  ngOnInit() {
    // ถ้าล็อกอินอยู่แล้ว ให้ข้ามไปหน้าแรกทันที
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.initGoogleOneTap();
  }

  ngOnDestroy() {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.cancel();
    }
  }

  // One Tap จะจำการปิด prompt ไว้ใน g_state; รีเซ็ตเมื่อกลับมาที่หน้า login
  private resetOneTapState() {
    const expired = 'expires=Thu, 01 Jan 1970 00:00:01 GMT';
    const host = window.location.hostname;
    for (const domain of ['', 'domain=localhost;', 'domain=.localhost;', `domain=${host};`]) {
      document.cookie = `g_state=;path=/;${domain}${expired}`;
    }
  }

  private initGoogleOneTap() {
    const clientId = '652401007899-c8bqm5plsqvn94m07ga9u9uridg4tg07.apps.googleusercontent.com';
    let attempts = 0;
    this.resetOneTapState();

    const showPrompt = () => {
      if (typeof google === 'undefined' || !google.accounts?.id) {
        if (++attempts < 40) setTimeout(showPrompt, 250);
        return;
      }

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => this.handleOneTapCredential(response),
        auto_select: false,
        cancel_on_tap_outside: false,
        context: 'signin',
        use_fedcm_for_prompt: true
      });
      // FedCM ไม่ส่ง display/skip reason แบบ One Tap รุ่นเดิมแล้ว
      google.accounts.id.prompt();
    };

    if (document.readyState === 'complete') {
      setTimeout(showPrompt, 100);
    } else {
      window.addEventListener('load', () => setTimeout(showPrompt, 100), { once: true });
    }
  }

  private decodeJwt(token: string): any {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(
        window.atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      ));
    } catch {
      return null;
    }
  }

  // One Tap ส่ง credential เมื่อกดเลือกบัญชี จึงตรวจสิทธิ์และเข้าสู่ระบบต่อได้ทันที
  private handleOneTapCredential(response: any) {
    const profile = response?.credential ? this.decodeJwt(response.credential) : null;
    if (!profile?.email || this.isGoogleLoading) return;

    this.isGoogleLoading = true;
    this.errorMessage = '';
    this.firebaseAuth.verifyWithBackend({
      email: profile.email,
      displayName: profile.name || '',
      photoUrl: profile.picture || ''
    }).subscribe({
      next: (res) => {
        this.isGoogleLoading = false;
        if (res.success && res.token) {
          this.authService.setSession(res.displayName || res.username || profile.email, res.token, res.serverInstanceId || '');
          this.router.navigate(['/']);
        } else {
          this.errorMessage = res.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์';
        }
      },
      error: (err) => {
        this.isGoogleLoading = false;
        if (err.status === 403 || err.error?.hasAccess === false) {
          this.unauthorizedEmail = profile.email;
          this.unauthorizedDisplayName = profile.name || '';
          this.unauthorizedMessage = err.error?.message || 'บัญชีนี้ยังไม่ได้ลงทะเบียนในระบบ';
          this.showUnauthorizedModal = true;
        } else {
          this.errorMessage = err.error?.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
        }
      }
    });
  }

  // 1. เข้าสู่ระบบแบบเดิม (Email @ru.ac.th / Password)
  onLogin() {
    if (this.isLoading) return;
    if (!this.email || !this.password) {
      this.errorMessage = 'กรุณากรอกชื่อผู้ใช้/อีเมลและรหัสผ่านให้ครบถ้วน';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({
      username: this.email,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          const username = res.username || this.email;
          this.authService.setSession(username, res.token || '', res.serverInstanceId || '');
          this.router.navigate(['/']);
        } else {
          this.errorMessage = res.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'เข้าสู่ระบบไม่สำเร็จ ตรวจสอบชื่อผู้ใช้หรือรหัสผ่าน';
      }
    });
  }

  // 2. เข้าสู่ระบบด้วย Google (ปุ่มตรงกลางหน้าจอ)
  async onGoogleLogin(loginHint?: string) {
    if (this.isGoogleLoading) return;
    this.isGoogleLoading = true;
    this.errorMessage = '';

    try {
      const cred = await this.firebaseAuth.signInWithGoogle(loginHint);
      const user = cred.user;

      if (!user.email) {
        throw new Error('ไม่พบบัญชีอีเมลจากการเข้าสู่ระบบ Google');
      }

      this.firebaseAuth.verifyWithBackend({
        email: user.email,
        displayName: user.displayName || '',
        photoUrl: user.photoURL || ''
      }).subscribe({
        next: (res) => {
          this.isGoogleLoading = false;
          if (res.success && res.token) {
            const username = res.displayName || res.username || user.email || '';
            this.authService.setSession(username, res.token, res.serverInstanceId || '');
            this.router.navigate(['/']);
          } else {
            this.errorMessage = res.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์';
          }
        },
        error: (err) => {
          this.isGoogleLoading = false;
          if (err.status === 403 || err.error?.hasAccess === false) {
            // กรณีไม่มีข้อมูลในฐานข้อมูล MySQL -> เด้งหน้าต่างให้เลือกลงทะเบียนเข้าใช้งาน
            this.unauthorizedEmail = user.email || '';
            this.unauthorizedDisplayName = user.displayName || '';
            this.unauthorizedMessage = err.error?.message || 'บัญชีนี้ยังไม่ได้ลงทะเบียนในระบบ';
            this.showUnauthorizedModal = true;
          } else {
            this.errorMessage = err.error?.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
          }
        }
      });
    } catch (err: any) {
      this.isGoogleLoading = false;
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else if (err.code === 'auth/popup-blocked') {
        this.errorMessage = 'เบราว์เซอร์บล็อกหน้าต่าง Popup กรุณากดอนุญาตหรือคลิกปุ่มเพื่อเข้าสู่ระบบ';
      } else {
        this.errorMessage = err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google';
      }
    }
  }

  // ลงทะเบียนบัญชี Google เข้าสู่ MySQL ทันที
  confirmGoogleRegister() {
    if (!this.unauthorizedEmail || this.isRegisteringGoogle) return;
    this.isRegisteringGoogle = true;

    this.firebaseAuth.registerGoogleUser({
      email: this.unauthorizedEmail,
      fullName: this.unauthorizedDisplayName || this.unauthorizedEmail
    }).subscribe({
      next: (res) => {
        this.isRegisteringGoogle = false;
        if (res.success && res.token) {
          const username = res.displayName || res.username || this.unauthorizedEmail;
          this.authService.setSession(username, res.token, res.serverInstanceId || '');
          this.showUnauthorizedModal = false;
          this.router.navigate(['/']);
        } else {
          this.errorMessage = res.message || 'เกิดข้อผิดพลาดในการลงทะเบียนบัญชี Google';
          this.showUnauthorizedModal = false;
        }
      },
      error: (err) => {
        this.isRegisteringGoogle = false;
        this.errorMessage = err.error?.message || 'ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง';
        this.showUnauthorizedModal = false;
      }
    });
  }

  // สลับโหมด เข้าสู่ระบบ <-> สมัครสมาชิก
  toggleMode(mode?: boolean) {
    this.isRegisterMode = mode !== undefined ? mode : !this.isRegisterMode;
    this.errorMessage = '';
  }

  // สมัครสมาชิกทั่วไป (Username/Password)
  onRegister() {
    if (this.isLoading) return;
    if (!this.regUsername || !this.regPassword || !this.regConfirmPassword) {
      this.errorMessage = 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง';
      return;
    }
    if (this.regPassword !== this.regConfirmPassword) {
      this.errorMessage = 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน';
      return;
    }
    if (this.regPassword.length < 4) {
      this.errorMessage = 'รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register({
      username: this.regUsername,
      password: this.regPassword
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          const username = res.username || this.regUsername;
          this.authService.setSession(username, res.token || '', res.serverInstanceId || '');
          this.router.navigate(['/']);
        } else {
          this.errorMessage = res.message || 'สมัครสมาชิกไม่สำเร็จ';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
      }
    });
  }

  // ปิดหน้าต่างลงทะเบียน Google
  closeUnauthorizedModal() {
    this.showUnauthorizedModal = false;
    this.unauthorizedEmail = '';
    this.unauthorizedDisplayName = '';
    this.unauthorizedMessage = '';
    this.firebaseAuth.signOutGoogle();
  }
}
