import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  // Verifique se a porta do seu backend é 3000 mesmo
  private apiUrl = 'http://localhost:3000/api/jobs';

  constructor(private http: HttpClient) { }

  // 1. Listar todas as vagas (Dashboard)
  getJobs(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 2. Pegar detalhes de uma vaga (para a tela de detalhes)
  getJobById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // 3. Criar nova vaga
  createJob(jobData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, jobData);
  }
  
  // 4. Enviar análise vinculada à vaga
  analyzeResumes(formData: FormData): Observable<any> {
    return this.http.post<any>('http://localhost:3000/api/hiring/analyze', formData);
  }
}