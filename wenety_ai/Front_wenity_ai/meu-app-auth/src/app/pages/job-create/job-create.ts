import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HiringProcessService } from '../../services/hiring-process';
import { Router } from '@angular/router';

// Importe os componentes REAIS das suas etapas
import { SelectJobComponent } from '../select-job/select-job';
import { SetRequirementsComponent } from '../set-requirements/set-requirements';
import { UploadResumesComponent } from '../../components/upload-resumes/upload-resumes';

@Component({
  selector: 'app-job-create',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NgSwitch, // Importe o NgSwitch
    NgSwitchCase, // Importe o NgSwitchCase
    // Importe seus componentes de etapa
    SelectJobComponent, 
    SetRequirementsComponent, 
    UploadResumesComponent
  ],
  templateUrl: './job-create.html',
  styleUrls: ['./job-create.scss']
})
export class JobCreateComponent implements OnInit, OnDestroy {
  
  public service = inject(HiringProcessService);
  private router = inject(Router);

  ngOnInit() {
    // Inicia o funil quando o componente é carregado
    this.service.startHiringProcess();
  }

  cancel() {
    this.service.cancelHiringProcess();
    this.router.navigate(['/dashboard/requisicoes']);
  }
  
  ngOnDestroy() {
    // Garante que o processo seja cancelado se o usuário sair no meio
    // sem completar
    if (this.service.currentStep() > 0) {
      this.service.cancelHiringProcess();
    }
  }
}