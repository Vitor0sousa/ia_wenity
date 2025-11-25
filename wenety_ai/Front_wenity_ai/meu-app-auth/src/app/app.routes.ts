// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { AuthGuard } from './guards/auth-guard';
import { RegisterComponent } from './pages/cadastro/cadastro';
import { ChatComponent } from './pages/chat/chat';

// --- IMPORTE OS COMPONENTES DO FUNIL ---
import { SelectJobComponent } from './pages/select-job/select-job';
import { SetRequirementsComponent } from './pages/set-requirements/set-requirements';
import { UploadResumesComponent } from './components/upload-resumes/upload-resumes';
import { TrocarSenha } from './pages/trocar-senha/trocar-senha';
import path from 'path';
import { RecuperarSenhaComponent } from './pages/recuperar-senha/recuperar-senha';
import { RequisicoesListComponent } from './pages/requisicoes-list/requisicoes-list';
import { JobCreateComponent } from './pages/job-create/job-create';
import { RequisicaoDetalheComponent } from './pages/requisicao-detalhe/requisicao-detalhe';
import { HomePage } from './pages/home-page/home-page';

// --- 1. IMPORTE O SEU COMPONENTE DE MUDAR SENHA AQUI ---
// (Ajuste o caminho e o nome do componente se for diferente)


export const routes: Routes = [
  // ======================================================
  // --- Rotas Públicas (NÃO usam AuthGuard) ---
  // ======================================================
  { 
    path: 'login', 
    component: LoginComponent,
  },
  { 
    path: 'cadastro', 
    component: RegisterComponent,
  },
  // --- 2. ADICIONE A SUA NOVA ROTA DE SENHA AQUI ---
  { 
    path: 'trocar-senha/:token', // <-- Coloque o caminho que você quer usar
    component: TrocarSenha // <-- Use o nome do seu componente
    // (Importante: SEM 'canActivate: [AuthGuard]')
  },
{
path: 'recuperar-senha',
component:RecuperarSenhaComponent
},

  // ======================================================
  // --- Rotas Privadas (SÃO protegidas pelo AuthGuard) ---
  // ======================================================
{ 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'requisicoes', pathMatch: 'full' },
      
      // A lista de Vagas (Dashboard)
      { path: 'requisicoes', component: RequisicoesListComponent },
      
      // O Funil (Etapa 1, 2, 3)
      { path: 'nova-vaga', component: JobCreateComponent },
      
      // A Página de Detalhes/Ranking (Onde o card clica)
      { path: 'requisicoes/:id', component: RequisicaoDetalheComponent },
      
      // O Chat
      { path: 'chat', component: ChatComponent }
    ]
  },
  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [AuthGuard] 
  },
  {
    path: 'select-job',
    component: SelectJobComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'set-requirements',
    component: SetRequirementsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'upload-resumes',
    component: UploadResumesComponent,
    canActivate: [AuthGuard]
  },
  
  // --- Rotas Padrão ---
  { 
    path: '', 
    redirectTo: 'home', 
    pathMatch: 'full' 
  },

{ path: 'nova-vaga', component: JobCreateComponent },
{path: 'home', component: HomePage}
];