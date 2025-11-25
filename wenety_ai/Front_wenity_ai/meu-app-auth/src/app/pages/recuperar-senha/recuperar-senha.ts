import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-recuperar-senha',
  templateUrl: './recuperar-senha.html', // ✅ nome correto do arquivo
  styleUrls: ['./recuperar-senha.scss'], // ✅ nome correto do arquivo
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink// ✅ necessário para [(ngModel)]
    
  ]
})
export class RecuperarSenhaComponent {
  email: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  enviarRecuperacao() {
    if (!this.email) {
      alert('Digite um e-mail válido.');
      return;
    }

    this.http.post('http://localhost:3000/api/recuperar-senha', { email: this.email })
      .subscribe({
        next: (res: any) => {
          alert(res.message || 'E-mail de recuperação enviado com sucesso.');
          this.router.navigate(['/trocar-senha']); 
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.message || 'Erro ao enviar e-mail de recuperação.');
        }
      });
  }

  

}