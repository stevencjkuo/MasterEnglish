import React, { useState, useEffect, useCallback } from 'react';
import { Word, StudentLevel, QuizQuestion, UserStats, TargetLanguage } from './types';
import { geminiService } from './services/geminiService';
import WordCard from './components/WordCard';
import Quiz from './components/Quiz';

const App: React.FC = () => {
  // 核心修改：移除金鑰檢查狀態，預設為 true，因為金鑰在 Render 後端
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

  // 1. 初始化語言設定
  useEffect(() => {
    if (stats.targetLanguage) {
      setTargetLang(stats.targetLanguage);
    }
  }, [stats.targetLanguage]);

  // 2. 核心邏輯：向 Render 後端請求單字
  const loadWords = useCallback(async (selectedLevel: StudentLevel, language: TargetLanguage) => {
    setIsLoading(true);
    try {
      // 這會呼叫你修改過、使用 fetch 的 geminiService
      const newWords = await geminiService.fetchWordsByLevel(selectedLevel, language);
      setWords(newWords);
    } catch (err: any) {
      console.error("載入單字失敗:", err);
      alert("無法連接到 AI 伺服器，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. 當等級或語言改變時自動重新載入
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
      // 確保 geminiService.generateQuiz 也已改為 fetch 模式
      const questions = await geminiService.generateQuiz(words);
      setQuizQuestions(questions);
      setIsQuizMode(true);
    } catch (err: any) {
      console.error("測驗生成失敗:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = (score: number) => {
    alert(`測驗完成！你的得分是 ${score} / ${quizQuestions.length}`);
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
      {/* Header 與原本結構相同，但移除不必要的金鑰狀態判斷 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              E
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight hidden lg:block">EngVantage</h1>
          </div>

          <nav className="hidden md:flex space-x-1 bg-slate-100 p-1 rounded-xl">
            {[StudentLevel.JUNIOR, StudentLevel.SENIOR, StudentLevel.TOEIC].map((l) => (
              <button 
                key={l}
                onClick={() => setLevel(l)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${level === l ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {l}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* 語言選擇器 */}
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-indigo-300 transition-all group"
              >
                <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{targetLang}</span>
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
                  {Object.values(TargetLanguage).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full text-left px-4 py-3 text-sm font-semibold ${targetLang === lang ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => loadWords(level, targetLang)}
              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <section className="mb-12">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Master English Today</h2>
          <p className="text-slate-500 text-lg">AI 正在為你準備 {level} 的單字庫...</p>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500">正在呼叫 AI 翻譯中，首次啟動需等待約 30 秒...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map(word => (
              <WordCard key={word.id} word={word} onToggleLearned={toggleLearned} />
            ))}
          </div>
        )}

        {!isLoading && words.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
            <button 
              onClick={startQuiz}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl hover:scale-105 transition-all"
            >
              開始 {targetLang} 測驗
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
