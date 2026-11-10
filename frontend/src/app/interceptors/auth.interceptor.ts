import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor: ดักจับคำขอทุกตัวจาก Angular แล้วแนบ JWT Token ส่งไปให้ Backend อัตโนมัติ
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. ดึง Token จาก sessionStorage ที่เราเก็บไว้ตอน Login
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('auth_token') : null;

  // 2. ถ้ามี Token ให้แนบ Header "Authorization: Bearer <token>" ส่งไปด้วยเสมอ
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 3. ส่งคำขอต่อไป และดักฟัง Error 401 (ถ้า Token หมดอายุ ให้เด้งกลับหน้า Login ทันที)
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/login')) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};