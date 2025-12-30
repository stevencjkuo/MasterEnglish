
import React from 'react';
import { Word } from '../types.ts';
import { geminiService } from '../services/geminiService.ts';

interface WordCardProps {
  word: Word;
  onToggleLearned: (id: string) => void;
}

const WordCard: React.FC<WordCardProps> = ({ word, onToggleLearned }) => {
  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    geminiService.playPronunciation(word.word, "English");
  };

  const handleExamplePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    geminiService.playPronunciation(word.exampleSentence, "English");
  };

  const handleTranslationPronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    geminiService.playPronunciation(word.exampleTranslation);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">{word.word}</h3>
          <p className="text-indigo-600 font-medium text-sm">{word.phonetic}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={handlePronounce} className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>
          </button>
          <button onClick={() => onToggleLearned(word.id)} className={`p-2 rounded-full transition-colors ${word.learned ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 hover:text-indigo-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-slate-700 font-semibold mb-1">{word.translation}</p>
        <p className="text-slate-500 text-sm italic">{word.definition}</p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example</span>
          <button onClick={handleExamplePronounce} className="text-slate-400 hover:text-indigo-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>
          </button>
        </div>
        <p className="text-slate-700 mb-2 leading-relaxed">{word.exampleSentence}</p>
        <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
          <p className="text-slate-500 text-sm italic pr-2">{word.exampleTranslation}</p>
          <button onClick={handleTranslationPronounce} className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-400 hover:bg-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordCard;
