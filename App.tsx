
import React, { useState, useEffect, useCallback } from 'react';
import { Word, StudentLevel, QuizQuestion, UserStats, TargetLanguage } from './types.ts';
import { geminiService } from './services/geminiService.ts';
import WordCard from './components/WordCard.tsx';
import Quiz from './components/Quiz.tsx';

const App: React.FC = () => {
  const [hasApiKey] = useState<boolean>(true);
  const [level, setLevel] = useState<StudentLevel>(StudentLevel.JUNIOR);
  const [targetLang, setTargetLang] = useState<TargetLanguage>(TargetLanguage.TRADITIONAL_CHINESE);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('engvantage_stats');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        targetLanguage: parsed.targetLanguage || TargetLanguage.TRADITIONAL_CHINESE
      };
    }
    return {
      totalWordsLearned: 0,
      currentStreak: 0,
      lastStudyDate: '',
      level: StudentLevel.JUNIOR,
      targetLanguage: TargetLanguage.TRADITIONAL_CHINESE
    };
  });

  useEffect(() => {
    if (stats.targetLanguage) {
      setTargetLang(stats.targetLanguage);
    }
  }, [stats.targetLanguage]);

  const loadWords = useCallback(async (selectedLevel: StudentLevel, language: TargetLanguage) => {
    setIsLoading(true);
    try {
      const newWords = await geminiService.fetchWordsByLevel(selectedLevel, language);
      setWords(newWords);
    } catch (err: any) {
      console.error("Error loading words:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWords(level, targetLang);
  }, [level, targetLang, loadWords]);

  useEffect(() => {
    localStorage.setItem('engvantage_stats', JSON.stringify({ ...stats, targetLanguage: targetLang }));
  }, [stats, targetLang]);

  const toggleLearned = (id: string) => {
    setWords(prev => prev.map(w => {
      if (w.id === id) {
        const newState = !w.learned;
        if (newState) {
          setStats(s => ({ ...s, totalWordsLearned: s.totalWordsLearned + 1 }));
        } else {
          setStats(s => ({ ...s, totalWordsLearned: Math.max(0, s.totalWordsLearned - 1) }));
        }
        return { ...w, learned: newState };
      }
      return w;
    }));
  };

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const questions = await geminiService.generateQuiz(words);
      setQuizQuestions(questions);
      setIsQuizMode(true);
    } catch (err: any) {
      console.error("Quiz error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    alert(`Quiz Complete! You scored ${score} out of ${quizQuestions.length}.`);
    setIsQuizMode(false);
  };

  const handleLanguageChange = (lang: TargetLanguage) => {
    setTargetLang(lang);
    setShowLangMenu(false);
  };

  if (isQuizMode) {
    return (
      <Quiz 
        questions={quizQuestions} 
        onComplete={handleQuizComplete} 
        onCancel={() => setIsQuizMode(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 md:pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              E
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight hidden lg:block">EngVantage</h1>
          </div>

          <nav className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setLevel(StudentLevel.JUNIOR)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${level === StudentLevel.JUNIOR ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Junior High</button>
            <button onClick={() => setLevel(StudentLevel.SENIOR)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${level === StudentLevel.SENIOR ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Senior High</button>
            <button onClick={() => setLevel(StudentLevel.TOEIC)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${level === StudentLevel.TOEIC ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>TOEIC</button>
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-indigo-300 transition-all group">
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 hidden xs:block">{targetLang}</span>
              </button>
              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {Object.values(TargetLanguage).map((lang) => (
                      <button key={lang} onClick={() => handleLanguageChange(lang)} className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between ${targetLang === lang ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>{lang}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <div className="text-right hidden lg:block">
              <p className="text-xs font-bold text-slate-400 uppercase">Words Learned</p>
              <p className="text-lg font-bold text-indigo-600">{stats.totalWordsLearned}</p>
            </div>
            <button onClick={() => loadWords(level, targetLang)} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Master English Today</h2>
              <p className="text-slate-500 text-lg max-w-2xl">Explore 10 curated words for {level} in {targetLang}.</p>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium text-center">Loading {level} words in {targetLang}...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map(word => (
              <WordCard key={word.id} word={word} onToggleLearned={toggleLearned} />
            ))}
          </div>
        )}

        {!isLoading && words.length > 0 && (
          <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-20 w-full px-4 flex justify-center">
            <button onClick={startQuiz} className="flex items-center space-x-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl hover:bg-black hover:-translate-y-1 transition-all duration-300">
              <span>Take a Quiz</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
