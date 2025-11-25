import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HiringProcessService } from './services/hiring-process';


// Importe os novos componentes
import { SelectJobComponent } from './pages/select-job/select-job';
import { SetRequirementsComponent } from './pages/set-requirements/set-requirements';
import { UploadResumesComponent } from './components/upload-resumes/upload-resumes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, // Necessário se você ainda usa rotas para login, etc.
    
    // Adicione os imports dos componentes das etapas
    SelectJobComponent,
    SetRequirementsComponent,
    UploadResumesComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'meu-app-auth';
  hiringProcessService = inject(HiringProcessService);

  // Sinais para controle no template
  isHiringActive = this.hiringProcessService.isHiringProcessActive;
  currentStep = this.hiringProcessService.currentStep;
}
