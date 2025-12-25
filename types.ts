
export enum StudentLevel {
  JUNIOR = 'Junior High',
  SENIOR = 'Senior High'
}

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  definition: string;
  translation: string;
  exampleSentence: string;
  exampleTranslation: string;
  level: StudentLevel;
  learned: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  wordId: string;
  type: 'meaning' | 'spelling' | 'completion';
}

export interface UserStats {
  totalWordsLearned: number;
  currentStreak: number;
  lastStudyDate: string;
  level: StudentLevel;
}
