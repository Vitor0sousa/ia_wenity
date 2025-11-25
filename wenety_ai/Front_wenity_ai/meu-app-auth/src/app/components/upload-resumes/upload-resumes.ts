import { Component, inject, signal, OnDestroy } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { HiringProcessService } from '../../services/hiring-process';
import { JobOpening, HiringRequirements } from '../../services/models/hiring.models';
// Importes necessários para gerenciamento de subscrição e Observables
import { Observable, Subject, takeUntil } from 'rxjs'; 

@Component({
  selector: 'app-upload-resumes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload-resumes.html',
  styleUrl: './upload-resumes.scss'
})
export class UploadResumesComponent implements OnDestroy { 
  hiringProcessService = inject(HiringProcessService);
  selectedFiles = signal<File[]>([]);
  isLoading = signal(false); // Para feedback durante a análise

  selectedJob$: Observable<JobOpening | null> = this.hiringProcessService.selectedJob$;
  requirements$: Observable<HiringRequirements | null> = this.hiringProcessService.requirements$;
  
  // Subject para gerenciar a desinscrição de Observables
  private destroy$ = new Subject<void>(); 

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedFiles.set(files);
      this.hiringProcessService.uploadResumes(files);
    }
  }

  finish(): void {
    if (this.selectedFiles().length > 0) {
      this.isLoading.set(true); // Ativa o indicador de carregamento
      
      // Se inscreve no Observable retornado pelo serviço
      this.hiringProcessService.triggerAnalysis()
        .pipe(takeUntil(this.destroy$)) // Evita vazamento de memória
        .subscribe({
          next: (analysis) => {
            // Ação de sucesso (o service já cuida do redirecionamento)
            console.log('Análise concluída (Resultado opcional):', analysis);
          },
          error: (err) => {
            // Lidar com erro se a API real falhar
            alert('Erro durante a análise. Tente novamente.');
            console.error(err);
          },
          complete: () => {
            // Desativa o indicador de carregamento após a conclusão (sucesso ou erro)
            this.isLoading.set(false); 
          }
        });

    } else {
      alert('Por favor, carregue pelo menos um currículo.');
    }
  }

  previous(): void {
    // Não permite voltar se estiver carregando
    if (this.isLoading()) return;
    this.hiringProcessService.previousStep();
  }
  
  // Método obrigatório de cleanup para encerrar subscrições
  ngOnDestroy(): void { 
    this.destroy$.next();
    this.destroy$.complete();
  }
}