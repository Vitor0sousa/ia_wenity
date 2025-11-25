// src/app/services/auth.ts (Versão Sênior + Dupla Troca de Senha)

import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
// Importa Observable, of, BehaviorSubject, e throwError
import { Observable, of, BehaviorSubject, throwError } from 'rxjs'; 
import { tap, map, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode'; // Importação do jwt-decode

// --- Interfaces de Resposta e Dados ---

interface LoginResponse {
  token: string;
  refreshToken?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface RegisterResponse {
  message: string;
  userId: string;
}

interface Credentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// --- Interface ADICIONADA (do arquivo júnior, File 882) ---
export interface ChangePasswordData {
  token: string;
  newPassword: string;
}
// --------------------------------------------------------

interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private tokenRefreshTimer: any;
  
  // BehaviorSubject para rastrear o estado de autenticação
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadToken();
    }
  }

  private loadToken(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      this.isAuthenticatedSubject.next(true);
      this.scheduleTokenRefresh();
    } else {
      this.isAuthenticatedSubject.next(false);
      // Se o token expirou, tenta usar o refresh token
      if (token) {
        this.refreshToken().subscribe();
      }
    }
  }

  login(credentials: Credentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.token) {
          this.setToken(response.token);
          if (response.refreshToken) {
            this.setRefreshToken(response.refreshToken);
          }
          if (response.user && response.user.name) {
            this.setUserName(response.user.name);
          }
          this.isAuthenticatedSubject.next(true);
          this.scheduleTokenRefresh();
        }
      })
    );
  }

  register(registerData: RegisterData): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, registerData);
  }

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private setRefreshToken(refreshToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  private getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  isLoggedIn(): Observable<boolean> {
    return of(this.isAuthenticated());
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    
    // Tenta informar o backend sobre o logout
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken }).subscribe({
        next: () => console.log('Refresh token revogado no backend.'),
        error: () => console.warn('Não foi possível revogar o refresh token no backend.')
      });
    }

    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userName');
    }
    
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']); // Redireciona para o login
  }

  private setUserName(name: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userName', name);
    }
  }

  getUserName(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userName');
    }
    return null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: { exp: number } = jwtDecode(token);
      const expiry = decoded.exp * 1000;
      return expiry < Date.now();
    } catch (e) {
      return true;
    }
  }

  private scheduleTokenRefresh(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    const token = this.getToken();
    if (!token) return;

    try {
      const decoded: { exp: number } = jwtDecode(token);
      const expiry = decoded.exp * 1000;
      const now = Date.now();
      
      // Agenda a renovação 1 minuto antes de expirar
      const delay = expiry - now - (60 * 1000); 

      if (delay > 0) {
        this.tokenRefreshTimer = setTimeout(() => {
          this.refreshToken().subscribe();
        }, delay);
      } else {
        // Se já está perto de expirar (ou expirou), tenta renovar agora
        this.refreshToken().subscribe();
      }
    } catch (e) {
      console.error('Erro ao decodificar token para agendamento', e);
    }
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout(); // Desloga se não tiver refresh token
      return throwError(() => new Error('Refresh token não encontrado.'));
    }

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap((response) => {
        this.setToken(response.token);
        if (response.refreshToken) {
          this.setRefreshToken(response.refreshToken);
        }
        this.isAuthenticatedSubject.next(true);
        this.scheduleTokenRefresh(); // Reagenda a próxima renovação
      }),
      catchError((err) => {
        console.error('Erro ao renovar token', err);
        this.logout(); // Desloga se a renovação falhar
        return throwError(() => err);
      })
    );
  }

  // ===========================================
  // --- MÉTODOS DE TROCA DE SENHA ADICIONADOS ---
  // ===========================================

  /**
   * Método 1: (Do dev júnior)
   * Usado por componentes que enviam o objeto 'ChangePasswordData'.
   */
  changePassword(data: ChangePasswordData): Observable<any> {
    return this.http.post(`${this.apiUrl}/trocar-senha`, data);
  }

  /**
   * Método 2: (Do dev sênior, fornecido por você)
   * Usado para resetar a senha (provavelmente via link de e-mail).
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/trocar-senha`, { token, newPassword });
  }

}