
export enum Language {
  UZBEK = 'Uzbek',
  KAZAKH = 'Kazakh',
  TAJIK = 'Tajik',
  KYRGYZ = 'Kyrgyz',
  RUSSIAN = 'Russian'
}

export interface MnemonicResponse {
  word: string;
  transcription: string;
  meaning: string;
  morphology: string;
  imagination: string;
  phoneticLink: string;
  connectorSentence: string;
  examples: string[];
  imagePrompt: string;
}

export interface SavedMnemonic {
  id: string;
  word: string;
  data: MnemonicResponse;
  imageUrl: string;
  timestamp: number;
  language: Language;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  RESULTS = 'RESULTS',
  VOICE_MODE = 'VOICE_MODE',
  ERROR = 'ERROR'
}

export enum AppView {
  HOME = 'HOME',
  DASHBOARD = 'DASHBOARD',
  FLASHCARDS = 'FLASHCARDS'
}
