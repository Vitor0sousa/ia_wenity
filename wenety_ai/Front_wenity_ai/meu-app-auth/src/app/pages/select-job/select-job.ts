import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HiringProcessService } from '../../services/hiring-process';
import { JobOpening } from '../../services/models/hiring.models';

@Component({
  selector: 'app-select-job',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-job.html',
  styleUrl: './select-job.scss'
})
export class SelectJobComponent implements OnInit {
  hiringProcessService = inject(HiringProcessService);
  jobOpenings: JobOpening[] = []; // Carregue suas vagas aqui (API ou mock)
  selectedJobId: string | null = null;

  ngOnInit(): void {
    // Exemplo de carregamento mockado
    this.jobOpenings = [
      { id: 'job1', title: 'Desenvolvedor Frontend ', description: 'Vaga para desenvolvedor com experiência Desenvolvimento Frontend.' },
      { id: 'job2', title: 'Engenheiro de Dados', description: 'Experiência com pipelines de dados e cloud.' },
      { id: 'job3', title: 'UX Designer ', description: 'Foco em design de interfaces para aplicações web.' },
      {id: 'job4', title: 'Desenvolvedor Backend', description: 'Vaga para desenvolvedor com experiência em Node.js.'},
      {id: 'job5', title: 'Desenvolvedor fullStack', description: 'Vaga para Desenvolvedor fullStack com experiência em Node.js e Angular.'},
      {id: 'job6', title: 'Especialista em Ai', description: 'Vaga para especialista em Inteligência Artificial e Machine Learning.'}
    ];
    this.selectedJobId = this.hiringProcessService.currentSelectedJob?.id ?? null;
  }

  selectJob(job: JobOpening): void {
    this.selectedJobId = job.id;
    this.hiringProcessService.selectJob(job);
  }

  next(): void {
    if (this.selectedJobId) {
      this.hiringProcessService.nextStep();
    } else {
      alert('Por favor, selecione uma vaga.');
    }
  }

  cancel(): void {
    this.hiringProcessService.cancelHiringProcess();
  }
}
