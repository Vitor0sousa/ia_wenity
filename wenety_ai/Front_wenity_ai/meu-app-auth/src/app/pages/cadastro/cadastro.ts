// src/app/pages/register/register.component.ts

import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastro.html',
  styleUrls: ['./cadastro.scss'] // Assumindo que você renomeou o scss para o padrão do Angular
})
export class RegisterComponent {
  // Modelo de dados atualizado para corresponder ao formulário
  registerData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  };

  successMessage: string | null = null;
  errorMessage: string | null = null;
  isSubmitting: boolean = false; // Para desabilitar o botão durante a requisição

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    // Limpa mensagens antigas
    this.successMessage = null;
    this.errorMessage = null;

    // --- VALIDAÇÕES DO LADO DO CLIENTE ---
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'As senhas não coincidem.';
      return; // Para a execução
    }

    if (!this.registerData.termsAccepted) {
      this.errorMessage = 'Você precisa aceitar os termos e condições.';
      return; // Para a execução
    }
    // --- FIM DAS VALIDAÇÕES ---

    this.isSubmitting = true; // Desabilita o botão

    // Prepara os dados para enviar à API (sem os campos extras)
    const apiData = {
        name: this.registerData.name,
        email: this.registerData.email,
        password: this.registerData.password
    };

    this.authService.register(apiData).subscribe({
      next: (response) => {
        this.isSubmitting = false; // Reabilita o botão
        this.successMessage = `${response.message} Você será redirecionado para a tela de login...`;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000); // Espera 3 segundos
      },
      error: (err) => {
        this.isSubmitting = false; // Reabilita o botão
        if (err.status === 409) {
          this.errorMessage = 'Este email já está cadastrado.';
        } else {
          this.errorMessage = 'Ocorreu um erro. Por favor, tente novamente.';
        }
        console.error('Erro no cadastro:', err);
      }
    });
  }
}