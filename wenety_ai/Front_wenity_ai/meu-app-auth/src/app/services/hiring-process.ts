import { Injectable, signal, WritableSignal, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs'; 
import { tap, catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http'; 
import { Router } from '@angular/router';
import { JobService } from './job'; 
import { JobOpening, HiringRequirements, ResumeAnalysis } from './models/hiring.models'; 

// Ajuste se seu backend rodar em outra porta
const API_URL = 'http://localhost:3000/api';

@Injectable({
  providedIn: 'root'
})
export class HiringProcessService {
  // --- Estado do Processo (Funil) ---
  public isHiringProcessActive: WritableSignal<boolean> = signal(false);
  public currentStep: WritableSignal<number> = signal(0); // 0: Inativo, 1: Vaga, 2: Requisitos, 3: Upload

  // Dados do formulário
  private selectedJobSubject = new BehaviorSubject<JobOpening | null>(null);
  selectedJob$ = this.selectedJobSubject.asObservable();

  private requirementsSubject = new BehaviorSubject<HiringRequirements | null>(null);
  requirements$ = this.requirementsSubject.asObservable();

  private resumesSubject = new BehaviorSubject<File[]>([]);
  resumes$ = this.resumesSubject.asObservable();

  // --- Estado do Dashboard ---
  public recentAnalyses: WritableSignal<ResumeAnalysis[]> = signal([]);

  // Injeção de Dependências
  private http = inject(HttpClient); 
  private jobService = inject(JobService);
  private router = inject(Router);

  constructor() {
    this.loadRecentAnalyses(); 
  }

  // =================================================
  //   CONTROLE DO PROCESSO (FUNIL)
  // =================================================

  startHiringProcess(): void {
    this.resetProcess();
    this.isHiringProcessActive.set(true);
    this.currentStep.set(1);
    console.log('Iniciando Funil de Vaga...');
  }

  cancelHiringProcess(): void {
    this.isHiringProcessActive.set(false);
    this.currentStep.set(0);
    this.resetProcess();
    console.log('Processo cancelado.');
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current < 3) {
      this.currentStep.set(current + 1);
    } 
  }

  previousStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set(current - 1);
    } else {
      this.cancelHiringProcess();
      this.router.navigate(['/dashboard/requisicoes']);
    }
  }

  // =================================================
  //   GESTÃO DE DADOS (FORMULÁRIO)
  // =================================================

  selectJob(job: JobOpening): void {
    this.selectedJobSubject.next(job);
  }

  setRequirements(requirements: HiringRequirements): void {
    this.requirementsSubject.next(requirements);
  }

  updateResumes(files: File[]): void {
    this.resumesSubject.next(files);
  }
  
  // Método antigo para compatibilidade, se necessário
  uploadResumes(files: File[]): void {
    this.updateResumes(files);
  }

  private resetProcess(): void {
    this.selectedJobSubject.next(null);
    this.requirementsSubject.next(null);
    this.resumesSubject.next([]);
  }

  // =================================================
  //   AÇÃO PRINCIPAL: CRIAR VAGA -> ANALISAR
  // =================================================

  /**
   * Este é o método mágico que conecta o Funil ao ATS.
   * 1. Cria a Vaga no Banco (POST /api/jobs)
   * 2. Usa o ID retornado para enviar os currículos (POST /api/hiring/analyze)
   */
  triggerAnalysis(): Observable<any> { 
    const job = this.selectedJobSubject.value;
    const requirements = this.requirementsSubject.value;
    const resumes = this.resumesSubject.value;

    // Validação básica
    if (!job || !requirements || resumes.length === 0) {
      const msg = 'Dados incompletos. Preencha todas as etapas.';
      console.error(msg);
      return throwError(() => new Error(msg));
    }

    // 1. Preparar payload para criar a vaga
    const newJobPayload = {
      title: job.title,
      description: (job as any).description || 'Vaga criada via assistente', 
      requirements: requirements
    };

    console.log('Etapa 1: Criando vaga...', newJobPayload);

    // 2. Fluxo: Criar Vaga -> Pegar ID -> Analisar Currículos
    return this.jobService.createJob(newJobPayload).pipe(
      
      // SwitchMap troca o Observable da criação pelo da análise
      switchMap((createdJob: any) => {
        const jobId = createdJob.id;
        console.log(`Etapa 2: Vaga criada (ID: ${jobId}). Enviando ${resumes.length} currículos...`);

        // Montar FormData com arquivos e o ID da vaga
        const formData = new FormData();
        formData.append('job_id', jobId.toString()); 

        resumes.forEach((file) => {
          formData.append('resumes', file, file.name);
        });

        // Chama a análise vinculada a essa vaga
        return this.jobService.analyzeResumes(formData);
      }),

      // Tap executa efeitos colaterais em caso de sucesso
      tap(analysisResult => {
        console.log('Etapa 3: Análise concluída!', analysisResult);
        
        // Finaliza o processo e redireciona
        this.isHiringProcessActive.set(false);
        this.currentStep.set(0);
        this.resetProcess();
        
        // Redireciona para a lista (onde o novo card vai aparecer)
        this.router.navigate(['/dashboard/requisicoes']);
      }),

      // Tratamento de erro
      catchError((err) => {
        console.error('Erro no processo de contratação:', err);
        return throwError(() => new Error(err.error?.message || 'Falha ao processar vaga e currículos.'));
      })
    );
  }

  // =================================================
  //   OUTROS MÉTODOS
  // =================================================

  private loadRecentAnalyses(): void {
    this.recentAnalyses.set([]);
    this.http.get<ResumeAnalysis[]>(`${API_URL}/hiring/history`).pipe(
      catchError(err => of([]))
    ).subscribe(analyses => {
      this.recentAnalyses.set(analyses);
    });
  }

  // Getters para facilitar acesso nos componentes
  get currentSelectedJob(): JobOpening | null { return this.selectedJobSubject.value; }
  get currentRequirements(): HiringRequirements | null { return this.requirementsSubject.value; }
  get currentResumes(): File[] { return this.resumesSubject.value; }
}