import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Importe ReactiveFormsModule
import { HiringProcessService } from '../../services/hiring-process';
import { HiringRequirements, JobOpening } from '../../services/models/hiring.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-set-requirements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // Adicione ReactiveFormsModule
  templateUrl: './set-requirements.html',
  styleUrl: './set-requirements.scss'
})
export class SetRequirementsComponent implements OnInit {
  hiringProcessService = inject(HiringProcessService);
  fb = inject(FormBuilder);

  requirementsForm!: FormGroup;
  selectedJob$: Observable<JobOpening | null> = this.hiringProcessService.selectedJob$;
  experienceLevels: HiringRequirements['experienceLevel'][] = ['Junior', 'Pleno', 'Senior', 'Especialista'];

  ngOnInit(): void {
    const currentReqs = this.hiringProcessService.currentRequirements;
    this.requirementsForm = this.fb.group({
      experienceLevel: [currentReqs?.experienceLevel || '', Validators.required],
      requiredSkills: [currentReqs?.requiredSkills?.join(', ') || ''], // Usando vírgula como separador
      niceToHaveSkills: [currentReqs?.niceToHaveSkills?.join(', ') || ''],
      specificRequirements: [currentReqs?.specificRequirements || '']
    });
  }

  // Helper para converter string separada por vírgula em array
  private skillsToArray(skillsString: string | undefined): string[] | undefined {
    if (!skillsString || skillsString.trim() === '') {
      return undefined;
    }
    return skillsString.split(',').map(s => s.trim()).filter(s => s);
  }

  next(): void {
    if (this.requirementsForm.valid) {
      const formValue = this.requirementsForm.value;
      const requirements: HiringRequirements = {
        experienceLevel: formValue.experienceLevel,
        requiredSkills: this.skillsToArray(formValue.requiredSkills),
        niceToHaveSkills: this.skillsToArray(formValue.niceToHaveSkills),
        specificRequirements: formValue.specificRequirements || undefined
      };
      this.hiringProcessService.setRequirements(requirements);
      this.hiringProcessService.nextStep();
    } else {
      alert('Por favor, preencha o nível de experiência.');
      this.requirementsForm.markAllAsTouched(); // Marca campos inválidos
    }
  }

  previous(): void {
    this.hiringProcessService.previousStep();
  }
}
