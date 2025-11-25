// src/app/pages/chat/chat.ts
import { Component, ViewChild, ElementRef, AfterViewChecked, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, HistoryMessage } from '../../services/chat';

interface DisplayMessage {
  text: string;
  sender: 'user' | 'bot';
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef; // Referência para o input de arquivo

  messages: DisplayMessage[] = [];
  history: HistoryMessage[] = [];
  currentMessage: string = '';
  isLoading: boolean = false;
  selectedFile: File | null = null; // --- ADICIONADO: para guardar o arquivo

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // A lógica de carregar histórico continua a mesma
    this.loadHistory();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // --- ADICIONADO: Método para capturar o arquivo selecionado ---
  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      // Limpa a mensagem atual para o usuário digitar a instrução
      if (!this.currentMessage.trim()){
        this.currentMessage = '';
      }
    }
  }

  // --- MODIFICADO: A lógica de envio agora tem duas vertentes ---
  sendMessage(): void {
    if (this.isLoading) return;

    // Vertente 1: Se um arquivo estiver selecionado, faz a análise
    if (this.selectedFile) {
      this.handleResumeAnalysis();
    }
    // Vertente 2: Se for apenas texto, continua como chat normal
    else if (this.currentMessage.trim()) {
      this.handleTextMessage();
    }
  }

  // --- ADICIONADO: Lógica para enviar o arquivo e a instrução ---
  private handleResumeAnalysis(): void {
    if (!this.selectedFile) return;

    const userPrompt = this.currentMessage.trim() || 'Faça uma análise geral';
    const fileName = this.selectedFile.name;

    this.messages.push({
      text: `Analisando o currículo "${fileName}" com a instrução: "${userPrompt}"`,
      sender: 'user'
    });

    this.isLoading = true;
    this.cdr.detectChanges();

    this.chatService.analyzeResume(this.selectedFile, userPrompt).subscribe({
      next: (response) => {
        this.messages.push({ text: response.response, sender: 'bot' });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messages.push({ text: 'Desculpe, houve um erro ao analisar o seu documento.', sender: 'bot'});
        this.isLoading = false;
        console.error('Erro na análise de currículo:', err);
        this.cdr.detectChanges();
      }
    });

    // Limpa o estado após o envio
    this.currentMessage = '';
    this.selectedFile = null;
    this.fileInput.nativeElement.value = '';
  }

  // --- Lógica do chat de texto (ligeiramente ajustada) ---
  private handleTextMessage(): void {
    const userMsgText = this.currentMessage;
    this.messages.push({ text: userMsgText, sender: 'user' });
    this.currentMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    this.chatService.sendMessage(userMsgText, this.history).subscribe({
      next: (response) => {
        this.messages.push({ text: response.response, sender: 'bot' });
        this.history.push({ role: 'user', parts: [{ text: userMsgText }] });
        this.history.push({ role: 'model', parts: [{ text: response.response }] });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.messages.push({ text: 'Desculpe, não consegui processar sua mensagem.', sender: 'bot' });
        this.isLoading = false;
        console.error('Erro ao enviar mensagem:', err);
        this.cdr.detectChanges();
      }
    });
  }

  private loadHistory(): void {
    // ... (este método continua igual) ...
  }

  private scrollToBottom(): void {
    // ... (este método continua igual) ...
  }
}