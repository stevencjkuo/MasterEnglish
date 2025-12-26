
import React, { useState, useEffect, useCallback } from 'react';
import { Word, StudentLevel, QuizQuestion, UserStats } from './types';
import { geminiService } from './services/geminiService';
import WordCard from './components/WordCard';
import Quiz from './components/Quiz';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [level, setLevel] = useState<StudentLevel>(StudentLevel.JUNIOR);
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('engvantage_stats');
    return saved ? JSON.parse(saved) : {
      totalWordsLearned: 0,
      currentStreak: 0,
      lastStudyDate: '',
      level: StudentLevel.JUNIOR
    };
  });

  const checkApiKey = useCallback(async () => {
    // Rely on the pre-configured window.aistudio helper
    if ((window as any).aistudio) {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    } else {
      // If not in an environment with aistudio helper, assume key is in process.env
      setHasApiKey(true);
    }
  }, []);

  const handleConnectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      // Proceed immediately as per race condition instructions: assume key selection was successful
      setHasApiKey(true);
    }
  };

  const loadWords = useCallback(async (selectedLevel: StudentLevel) => {
    if (!hasApiKey) return;
    setIsLoading(true);
    try {
      const newWords = await geminiService.fetchWordsByLevel(selectedLevel);
      setWords(newWords);
    } catch (err: any) {
      console.error(err);
      // Reset key selection if the request fails with 404/Not Found
      if (err?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [hasApiKey]);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  useEffect(() => {
    if (hasApiKey) {
      loadWords(level);
    }
  }, [level, loadWords, hasApiKey]);

  useEffect(() => {
    localStorage.setItem('engvantage_stats', JSON.stringify(stats));
  }, [stats]);

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
      console.error(err);
      if (err?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    alert(`Quiz Complete! You scored ${score} out of ${quizQuestions.length}.`);
    setIsQuizMode(false);
  };

  // Setup / Connection Screen
  if (hasApiKey === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-xl shadow-indigo-200 mx-auto mb-8">
            E
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-4">Welcome to EngVantage</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            To start your AI-powered English learning journey, please connect your Google Gemini API key.
          </p>
          <button 
            onClick={handleConnectKey}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center space-x-3"
          >
            <span>Connect to Gemini AI</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
          </button>
          <p className="mt-6 text-xs text-slate-400">
            Requires a paid API key from a Google Cloud Project. 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-indigo-500 underline ml-1">Learn more</a>
          </p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              E
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">EngVantage</h1>
          </div>

          <nav className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setLevel(StudentLevel.JUNIOR)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${level === StudentLevel.JUNIOR ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Junior High
            </button>
            <button 
              onClick={() => setLevel(StudentLevel.SENIOR)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${level === StudentLevel.SENIOR ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Senior High
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 mr-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-400 uppercase">AI Connected</span>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Words</p>
              <p className="text-lg font-bold text-indigo-600">{stats.totalWordsLearned}</p>
            </div>
            <button 
              onClick={() => loadWords(level)}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Refresh Word List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            <button 
              onClick={handleConnectKey}
              className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Change API Key"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome Section */}
        <section className="mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Master English Today</h2>
          <p className="text-slate-500 text-lg max-w-2xl">
            Explore 10 curated words for {level} level. Pronounce, practice, and power up your vocabulary with AI.
          </p>
        </section>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Summoning words from the AI cloud...</p>
          </div>
        )}

        {/* Word Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map(word => (
              <WordCard 
                key={word.id} 
                word={word} 
                onToggleLearned={toggleLearned}
              />
            ))}
          </div>
        )}

        {/* Floating Action Button for Quiz */}
        {!isLoading && words.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
            <button 
              onClick={startQuiz}
              className="flex items-center space-x-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all duration-300 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0V9.457c0-.621-.504-1.125-1.125-1.125h-.872M9.507 8.332V4.5a2.25 2.25 0 0 1 2.25-2.25h1.5a2.25 2.25 0 0 1 2.25 2.25v3.832" />
              </svg>
              <span>Start Quick Quiz</span>
            </button>
          </div>
        )}
      </main>

      {/* Mobile Nav Overlay (Simple) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 grid grid-cols-2 gap-2 z-20">
        <button 
          onClick={() => setLevel(StudentLevel.JUNIOR)}
          className={`py-3 rounded-xl text-sm font-bold ${level === StudentLevel.JUNIOR ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
        >
          Junior
        </button>
        <button 
          onClick={() => setLevel(StudentLevel.SENIOR)}
          className={`py-3 rounded-xl text-sm font-bold ${level === StudentLevel.SENIOR ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
        >
          Senior
        </button>
      </div>
    </div>
  );
};

export default App;
