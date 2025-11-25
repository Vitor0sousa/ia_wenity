export interface JobOpening {
  id: string;
  title: string;
  description?: string;
}

export interface HiringRequirements {
  experienceLevel?: 'Junior' | 'Pleno' | 'Senior' | 'Especialista';
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  specificRequirements?: string; // Campo de texto livre
}

export interface ResumeAnalysis {
  jobOpening: JobOpening;
  requirements: HiringRequirements; // Propriedade para armazenar a "requisição"
  bestCandidate: string; // Pode ser um objeto mais complexo com dados do candidato
  analyzedResumesCount: number;
  analysisDate: Date;
  analysisText?: string;
}

