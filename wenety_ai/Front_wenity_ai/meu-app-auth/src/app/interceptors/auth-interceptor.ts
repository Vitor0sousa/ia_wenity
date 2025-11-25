// src/app/interceptors/auth-interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    // Se o token existir, clona a requisição e adiciona o header Authorization
    if (token) {
      const clonedRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
      
      // Envia a requisição clonada com tratamento de erros
      return next.handle(clonedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          // Se o token expirou ou é inválido (401 Unauthorized)
          if (error.status === 401) {
            console.error('Token inválido ou expirado. Redirecionando para login...');
            
            // Remove token inválido usando o AuthService
            this.authService.logout();
            
            // Redireciona para login
            this.router.navigate(['/login']);
          }

          // Se é erro de servidor (500)
          if (error.status === 500) {
            console.error('Erro no servidor:', error.error);
          }

          // Repassa o erro para quem chamou
          return throwError(() => error);
        })
      );
    }

    // Se não houver token, envia a requisição original
    return next.handle(request);
  }
}