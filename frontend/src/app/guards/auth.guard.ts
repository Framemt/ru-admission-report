import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // ตรวจสอบกับ Backend ว่าเซิร์ฟเวอร์เพิ่งรีสตาร์ทใหม่ (nodemon) หรือไม่
  return authService.checkServerSession().pipe(
    map(res => {
      if (res.valid) {
        return true;
      }
      // เซิร์ฟเวอร์เพิ่งเปิดใหม่ หรือ Session เก่า -> ดีดไปหน้า login ทันที
      router.navigate(['/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};

export const guestGuard: CanActivateFn = (_route, _state) => {
  // อนุญาตให้เข้าหน้า /login ได้เสมอ ไม่บังคับดีดไปหน้าแรก
  return true;
};

