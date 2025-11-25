import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; 
import { ActivatedRoute, RouterModule } from '@angular/router';
import { JobService } from '../../services/job';

@Component({
  selector: 'app-requisicao-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe], 
  templateUrl: './requisicao-detalhe.html',
  styleUrls: ['./requisicao-detalhe.scss']
})
export class RequisicaoDetalheComponent implements OnInit {
  
  private route = inject(ActivatedRoute);
  private jobService = inject(JobService);

  // Signals para controlar a página
  public job: WritableSignal<any> = signal(null);
  public loading: WritableSignal<boolean> = signal(true);

  // Signal que controla o modal (guarda os dados do candidato selecionado)
  public selectedCandidateAnalysis: WritableSignal<any> = signal(null);

  ngOnInit() {
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.loadJobDetails(jobId);
    } else {
      console.error("ID da vaga não foi encontrado na URL.");
      this.loading.set(false);
    }
  }

  loadJobDetails(id: string) {
    this.loading.set(true); 

    this.jobService.getJobById(id).subscribe({
      next: (data) => {
        console.log("Dados da vaga recebidos no Front:", data);
        this.job.set(data); // Atualiza o signal da vaga
        this.loading.set(false); // Atualiza o signal de loading
      },
      error: (err) => {
        console.error('Erro ao carregar vaga', err);
        this.loading.set(false);
      }
    });
  }

  // --- FUNÇÕES DO MODAL ---
  
  /**
   * Chamada pelo (click) do botão "Ver Análise".
   * Recebe a candidatura (app) e salva o structured_data no signal.
   */
  openAnalysisModal(candidateApplication: any) {
    this.selectedCandidateAnalysis.set(candidateApplication.structured_data);
  }

  /**
   * Chamada pelo (click) do 'X' ou do fundo do modal.
   * Limpa o signal, fechando o modal.
   */
  closeAnalysisModal() {
    this.selectedCandidateAnalysis.set(null);
  }

  // --- FUNÇÕES AUXILIARES ---

  getSkillsText(skills: any): string {
    if (Array.isArray(skills)) return skills.join(', ');
    return skills || 'Nenhuma';
  }

  /**
   * Tenta quebrar um texto em itens de lista.
   * Útil para 'pontos_fortes' e 'pontos_fracos'.
   */
  parseTextToList(text: string | undefined): string[] {
    if (!text || text.trim() === '') {
      return [];
    }
    
    // 1. Remove marcadores comuns (*, -, 1.)
    text = text.replace(/^[*-]\s*|^\d+\.\s*/gm, '').trim();

    // 2. Quebra por quebra de linha
    let items = text.split('\n').filter(item => item.trim() !== '');
    
    // 3. Se for uma única linha, tenta quebrar por ponto final
    if (items.length === 1 && items[0].length > 100) {
       items = items[0].split(/[.!?]\s/).filter(item => item.trim() !== '');
       items = items.map(item => item.endsWith('.') ? item : item + '.');
    }
    
    // Filtra itens vazios
    return items.filter(item => item.length > 5);
  }

  // Esta função não é mais necessária se não vamos mostrar o JSON bruto
  // Mas pode manter caso queira adicionar um botão de "Ver JSON"
  formatJson(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}