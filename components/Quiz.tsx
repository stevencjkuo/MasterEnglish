
import React, { useState } from 'react';
import { QuizQuestion } from '../types.ts';

interface QuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  onCancel: () => void;
}

const Quiz: React.FC<QuizProps> = ({ questions, onComplete, onCancel }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const currentQuestion = questions[currentIdx];

  const handleSelect = (option: string) => {
    if (showAnswer) return;
    setSelectedOption(option);
    setShowAnswer(true);
    if (option === currentQuestion.correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      onComplete(score);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <span className="text-slate-400 font-medium">Question {currentIdx + 1} of {questions.length}</span>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 leading-tight">{currentQuestion.question}</h2>
        </div>
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let bgColor = 'bg-slate-50 border-slate-200 hover:border-indigo-300';
            if (showAnswer) {
              if (option === currentQuestion.correctAnswer) bgColor = 'bg-green-100 border-green-500 text-green-700';
              else if (option === selectedOption) bgColor = 'bg-red-100 border-red-500 text-red-700';
              else bgColor = 'bg-slate-50 border-slate-200 opacity-50';
            }
            return (
              <button key={idx} disabled={showAnswer} onClick={() => handleSelect(option)} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ${bgColor}`}>{option}</button>
            );
          })}
        </div>
        {showAnswer && (
          <div className="mt-8">
            <button onClick={handleNext} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
