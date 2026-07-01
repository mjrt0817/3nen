export type SubjectType = 'math' | 'kanji';

export interface LearningLog {
  id: string;
  date?: string; // YYYY-MM-DD
  timestamp: number;
  subject: SubjectType;
  topicName: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number; // 0 - 100
  coinsEarned: number;
  feedback?: string;
  strokesFeedback?: string;
}

export type RarityType = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

export interface Card {
  id: string;
  name: string;
  rarity: RarityType;
  description: string;
  imageUrl: string;
  isCustom?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  requiredStreak: number;
  unlocked: boolean;
}

export interface StudentState {
  coins: number;
  unlockedCardIds: string[];
  customCards: Card[];
  learningLogs: LearningLog[];
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null; // YYYY-MM-DD
  unlockedBadgeIds: string[];
  childName?: string; // Custom child name for the app
}

export interface ArithmeticQuestion {
  id: string;
  num1: number;
  num2: number;
  operator: '÷' | '×' | '+' | '-';
  questionText: string;
  correctAnswer: number;
  options: number[];
  hint: string;
}

export interface KanjiQuestion {
  id: string;
  kanji: string; // target character
  reading: string; // e.g. "うた"
  contextBefore: string; // e.g. "うつくしい "
  contextAfter: string; // e.g. " をうたう"
  hint: string;
  strokeCount: number;
  modelImage?: string; // canvas trace guide overlay
}
