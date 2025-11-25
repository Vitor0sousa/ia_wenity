import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnalysisResponse {
  response: string;
}

export interface AnalysisResult {
  fileName: string;
  analysis: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResumeAnalysisService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  analyzeResume(file: File, prompt?: string): Observable<AnalysisResponse> {
    const formData = new FormData();
    formData.append('resume', file);
    
    if (prompt) {
      formData.append('prompt', prompt);
    }

    return this.http.post<AnalysisResponse>(
      `${this.apiUrl}/analyze-resume`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  // Método auxiliar para verificar se o token existe
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}
