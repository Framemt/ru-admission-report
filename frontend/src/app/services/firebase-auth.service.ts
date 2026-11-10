import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, UserCredential } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC1vcVX969GDWmY3fXoeY0zMhW6eZ-bBrE",
  authDomain: "test-sql-29aba.firebaseapp.com",
  projectId: "test-sql-29aba",
  storageBucket: "test-sql-29aba.firebasestorage.app",
  messagingSenderId: "652401007899",
  appId: "1:652401007899:web:6638c49070cd2ef998c7be",
  measurementId: "G-BCSJBPL4X3"
};

export interface GoogleVerifyResponse {
  success: boolean;
  hasAccess?: boolean;
  isNewUser?: boolean;
  message?: string;
  token?: string;
  username?: string;
  displayName?: string;
  photoUrl?: string;
  email?: string;
  serverInstanceId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api';

  private app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  private auth = getAuth(this.app);
  // 1. Popup Sign in with Google (Firebase)
  async signInWithGoogle(loginHint?: string): Promise<UserCredential> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
      ...(loginHint ? { login_hint: loginHint } : {})
    });
    return await signInWithPopup(this.auth, provider);
  }

  // 2. Call backend to verify email in MySQL
  verifyWithBackend(googleUser: { email: string; displayName?: string; photoUrl?: string }): Observable<GoogleVerifyResponse> {
    return this.http.post<GoogleVerifyResponse>(`${this.apiUrl}/auth/google-verify`, googleUser);
  }

  // 3. Register new Google user in MySQL
  registerGoogleUser(payload: { email: string; fullName: string; department?: string; phone?: string }): Observable<GoogleVerifyResponse> {
    return this.http.post<GoogleVerifyResponse>(`${this.apiUrl}/auth/google-register`, payload);
  }

  // 4. Sign out from Firebase
  async signOutGoogle(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (e) {
      console.warn('Firebase signout warning', e);
    }
  }
}
