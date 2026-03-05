import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, X } from 'lucide-react';
import { GrindQuiz as GrindQuizType, GrindQuizQuestion } from '../../types/grindZone';
import { GameTheme } from '../../utils/gameThemes';

interface GrindQuizProps {
  quiz: GrindQuizType;
  theme: GameTheme;
  onComplete: (score: number, passed: boolean) => void;
  onClose: () => void;
}

type AnswerState = {
  selectedIndex: number;
  isCorrect: boolean;
} | null;

const GrindQuiz: React.FC<GrindQuizProps> = ({ quiz, theme, onComplete, onClose }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>(null);
  const [isFinished, setIsFinished] = useState(false);

  const question: GrindQuizQuestion = quiz.questions[currentIndex];
  const total = quiz.questions.length;
  const score = total > 0 ? correctCount / total : 0;
  const passed = score >= quiz.pass_threshold;

  const handleSelect = useCallback((choiceIndex: number) => {
    if (answerState) return;
    const isCorrect = choiceIndex === question.correct_index;
    setAnswerState({ selectedIndex: choiceIndex, isCorrect });
    if (isCorrect) setCorrectCount(prev => prev + 1);
  }, [answerState, question]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswerState(null);
    } else {
      setIsFinished(true);
      const finalScore = (correctCount + (answerState?.isCorrect ? 0 : 0)) / total;
      onComplete(finalScore, finalScore >= quiz.pass_threshold);
    }
  }, [currentIndex, total, correctCount, answerState, onComplete, quiz.pass_threshold]);

  const handleRetry = useCallback(() => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setAnswerState(null);
    setIsFinished(false);
  }, []);

  const getChoiceStyle = (idx: number) => {
    if (!answerState) {
      return 'bg-gray-50 dark:bg-dark-300/30 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer';
    }
    if (idx === question.correct_index) {
      return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 ring-1 ring-emerald-500/30';
    }
    if (idx === answerState.selectedIndex && !answerState.isCorrect) {
      return 'bg-red-50 dark:bg-red-900/20 border-red-500 ring-1 ring-red-500/30';
    }
    return 'bg-gray-50 dark:bg-dark-300/30 border-gray-200 dark:border-gray-700 opacity-50';
  };

  if (isFinished) {
    return (
      <div className="bg-white dark:bg-dark-200/80 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-300 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: passed
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'linear-gradient(135deg, #F59E0B, #D97706)',
          }}
        >
          {passed ? (
            <Trophy className="w-10 h-10 text-white" />
          ) : (
            <RotateCcw className="w-10 h-10 text-white" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {correctCount}/{total}
        </h3>
        <p className="text-lg font-semibold mb-1" style={{ color: passed ? '#10B981' : '#F59E0B' }}>
          {passed ? t('grindZone.quiz.passed') : t('grindZone.quiz.failed')}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {passed
            ? t('grindZone.quiz.passedDesc')
            : t('grindZone.quiz.failedDesc')}
        </p>

        <div className="flex items-center justify-center gap-3">
          {!passed && (
            <button
              onClick={handleRetry}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
            >
              {t('grindZone.quiz.tryAgain')}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-dark-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-400 transition-colors"
          >
            {t('grindZone.quiz.backToPlaylist')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-dark-200/80 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="p-1.5 bg-gray-100 dark:bg-dark-300/50">
        <div className="flex gap-1">
          {quiz.questions.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: idx < currentIndex
                  ? theme.colors.primary
                  : idx === currentIndex
                    ? `${theme.colors.primary}60`
                    : 'rgba(156,163,175,0.3)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-3">
          {t('grindZone.quiz.questionOf', { current: currentIndex + 1, total })}
        </p>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
          {question.question_text}
        </h3>

        {question.screenshot_url && (
          <img
            src={question.screenshot_url}
            alt=""
            className="w-full h-40 object-cover rounded-lg mb-4"
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {question.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={!!answerState}
              className={`
                relative p-3.5 rounded-xl border text-sm text-left font-medium transition-all duration-200
                ${getChoiceStyle(idx)}
              `}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={
                    !answerState
                      ? { backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }
                      : idx === question.correct_index
                        ? { backgroundColor: '#10B981', color: '#FFF' }
                        : idx === answerState.selectedIndex
                          ? { backgroundColor: '#EF4444', color: '#FFF' }
                          : { backgroundColor: 'rgba(156,163,175,0.2)', color: 'rgba(156,163,175,0.6)' }
                  }
                >
                  {answerState && idx === question.correct_index ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : answerState && idx === answerState.selectedIndex && !answerState.isCorrect ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    String.fromCharCode(65 + idx)
                  )}
                </span>
                <span className="text-gray-800 dark:text-gray-200">{choice}</span>
              </div>
            </button>
          ))}
        </div>

        {answerState && (
          <div className={`p-3 rounded-lg text-sm mb-4 ${
            answerState.isCorrect
              ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300'
          }`}>
            {question.explanation}
          </div>
        )}

        {answerState && (
          <button
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
          >
            {currentIndex < total - 1 ? (
              <>
                {t('common.next')}
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              t('grindZone.quiz.seeResults')
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default GrindQuiz;
