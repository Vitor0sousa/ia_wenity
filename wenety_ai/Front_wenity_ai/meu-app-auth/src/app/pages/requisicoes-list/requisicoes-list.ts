import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importe o DatePipe
import { RouterModule } from '@angular/router';
import { JobService } from '../../services/job'; // Verifique se o caminho está certo

@Component({
  selector: 'app-requisicoes-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe], // Adicione o DatePipe aqui
  templateUrl: './requisicoes-list.html',
  styleUrls: ['./requisicoes-list.scss']
})
export class RequisicoesListComponent implements OnInit {
  // Injeção de dependência moderna
  private jobService = inject(JobService);

  // --- A CORREÇÃO PARA ZONELESS ---
  // Trocamos as variáveis normais por Signals
  public jobs: WritableSignal<any[]> = signal([]);
  public loading: WritableSignal<boolean> = signal(true);
  // --- FIM DA CORREÇÃO ---

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.loading.set(true); // Inicia o carregamento

    this.jobService.getJobs().subscribe({
      next: (data) => {
        console.log('DADOS RECEBIDOS NO FRONTEND:', data); // Você verá [ {vaga 16} ] aqui
        
        // --- A CORREÇÃO PARA ZONELESS ---
        // Usamos .set() para notificar o Angular da mudança
        this.jobs.set(data);
        this.loading.set(false);
        // --- FIM DA CORREÇÃO ---
      },
      error: (err) => {
        console.error('Erro ao buscar vagas', err);
        this.loading.set(false);
      }
    });
  }
}