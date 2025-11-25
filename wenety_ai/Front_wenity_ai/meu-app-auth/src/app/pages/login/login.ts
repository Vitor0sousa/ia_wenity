// src/app/pages/login/login.ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  imports: [CommonModule, FormsModule]
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: ''
  };
  errorMessage: string | null = null;
  private returnUrl: string = '/dashboard';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Se já estiver logado, redireciona direto
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    // Pega a URL de retorno dos query params (se houver)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onSubmit(): void {
    this.errorMessage = null;
    
    this.authService.login(this.credentials).subscribe({
      next: () => {
        // Redireciona para a página que o usuário tentou acessar
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Credenciais inválidas. Tente novamente.';
        console.error('Erro no login:', err);
      }
    });
  }
}