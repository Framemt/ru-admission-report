import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FirebaseAuthService } from './firebase-auth.service';

export interface LoginResponse {
  success: boolean;
  message?: string;
  username?: string;
  token?: string;
  serverInstanceId?: string;
  user?: {
    id: number;
    username: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private firebaseAuth = inject(FirebaseAuthService);
  private apiUrl = 'http://localhost:3000/api';

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  register(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, credentials);
  }

  setSession(username: string, token: string = '', serverInstanceId: string = ''): void {
    sessionStorage.setItem('auth_user', username);
    if (token) sessionStorage.setItem('auth_token', token);
    if (serverInstanceId) sessionStorage.setItem('server_instance_id', serverInstanceId);
    
    // Clear any session left behind by an earlier version of the application.
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('remembered_username');
  }

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem('auth_user');
  }

  getCurrentUser(): string | null {
    return sessionStorage.getItem('auth_user');
  }

  checkServerSession(): Observable<{ valid: boolean; instanceId?: string }> {
    return this.http.get<{ status: string; serverInstanceId?: string }>('http://localhost:3000/health').pipe(
      map(res => {
        const savedInstance = sessionStorage.getItem('server_instance_id');
        // หากเซิร์ฟเวอร์เพิ่งเปิดใหม่ (nodemon รีสตาร์ท) instance ID จะเปลี่ยน -> ให้ดีดกลับไปหน้า login ทันที
        if (!savedInstance || (res.serverInstanceId && savedInstance !== res.serverInstanceId)) {
          this.logout();
          return { valid: false, instanceId: res.serverInstanceId };
        }
        return { valid: true, instanceId: res.serverInstanceId };
      }),
      catchError(() => {
        this.logout();
        return of({ valid: false });
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('server_instance_id');
    this.firebaseAuth.signOutGoogle();
  }
}
