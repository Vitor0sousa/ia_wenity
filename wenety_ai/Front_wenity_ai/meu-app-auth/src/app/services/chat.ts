// src/app/services/chat.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  response: string;
}
export interface HistoryMessage {
    role: 'user' | 'model';
    parts: [{ text: string }];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getChatHistory(): Observable<HistoryMessage[]> {
    return this.http.get<HistoryMessage[]>(`${this.apiUrl}/chat/history`);
  }

  sendMessage(userMessage: string, history: HistoryMessage[]): Observable<ChatResponse> {
    const body = { message: userMessage, history: history };
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, body);
  }

  // --- ADICIONADO: NOVO MÉTODO PARA ANÁLISE DE CURRÍCULO ---
  analyzeResume(file: File, prompt: string): Observable<ChatResponse> {
    const formData = new FormData();
    // O nome 'resume' deve ser o mesmo usado no `upload.single('resume')` do backend
    formData.append('resume', file, file.name);
    // Adiciona a instrução do usuário no corpo do formulário
    formData.append('prompt', prompt);
    
    // O AuthInterceptor cuidará do token.
    return this.http.post<ChatResponse>(`${this.apiUrl}/analyze-resume`, formData);
  }
}