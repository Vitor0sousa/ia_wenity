import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, ChangePasswordData } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trocar-senha',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './trocar-senha.html',
  styleUrls: ['./trocar-senha.scss']
})
export class TrocarSenha {
  credentials: ChangePasswordData = {
    token: '',
    newPassword: ''
  };

  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  trocarSenha(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (!this.credentials.token || !this.credentials.newPassword) {
      this.errorMessage = 'Token e nova senha são obrigatórios.';
      return;
    }

    this.authService.changePassword(this.credentials).subscribe({
      next: (res: any) => {
        this.successMessage = res.message;
        console.log(res);

        // Redireciona para a página de login ou aba desejada após sucesso
        setTimeout(() => {
          this.router.navigate(['/login']); // ajuste para a rota correta se necessário
        }, 1500);
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Não foi possível alterar a senha.';
        console.error('Erro ao trocar senha:', err);
        alert(this.errorMessage);
      }
    });
  }
}