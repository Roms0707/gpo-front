import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, CheckCircle2, XCircle, ArrowRight, RotateCcw,
  Trophy, Loader, BookOpen,
} from 'lucide-react';
import { GameTheme } from '../../utils/gameThemes';
import { fetchQuizWithQuestions } from '../../services/grindZoneQuizService';
import {
  fetchUserSubmission,
  startQuizAttempt,
  savePartialProgress,
  completeQuiz,
} from '../../services/grindZoneQuizSubmissionService';
import type {
  GrindZoneQuizQuestion,
  QuizAnswerEntry,
  GrindZoneQuizSubmission,
  QuizWithQuestions,
} from '../../types/grindZoneQuiz';

interface QuizPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  userId: string;
  theme: GameTheme;
  onCompleted?: (score: number, total: number) => void;
}

type AnswerState = {
  selectedIndex: number | null;
  answerText: string | null;
  isCorrect: boolean;
  revealed: boolean;
} | null;

function gradeAnswer(
  question: GrindZoneQuizQuestion,
  selectedIndex: number | null,
  answerText: string | null
): boolean {
  if (question.question_type === 'open_ended') return false;
  if (selectedIndex == null || question.correct_answer_index == null) return false;
  return selectedIndex === question.correct_answer_index;
}

function getGradableCount(questions: GrindZoneQuizQuestion[]): number {
  return questions.filter(q => q.question_type !== 'open_ended').length;
}

const QuizPlayerModal: React.FC<QuizPlayerModalProps> = ({
  isOpen,
  onClose,
  quizId,
  userId,
  theme,
  onCompleted,
}) => {
  const { t } = useTranslation();

  const [quizData, setQuizData] = useState<QuizWithQuestions | null>(null);
  const [submission, setSubmission] = useState<GrindZoneQuizSubmission | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>(null);
  const [answers, setAnswers] = useState<QuizAnswerEntry[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [openEndedText, setOpenEndedText] = useState('');

  const submissionRef = useRef<GrindZoneQuizSubmission | null>(null);
  submissionRef.current = submission;

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setAnswerState(null);
    setAnswers([]);
    setIsFinished(false);
    setOpenEndedText('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsLoadingData(true);
    reset();

    (async () => {
      const qData = await fetchQuizWithQuestions(quizId);
      if (cancelled || !qData) {
        if (!cancelled) setIsLoadingData(false);
        return;
      }
      setQuizData(qData);

      const sub = await fetchUserSubmission(userId, quizId);
      if (cancelled) return;

      if (sub && sub.is_completed) {
        setSubmission(sub);
        setAnswers(sub.answers || []);
        setIsFinished(true);
        setIsLoadingData(false);
        return;
      }

      if (sub && !sub.is_completed && Array.isArray(sub.answers) && sub.answers.length > 0) {
        setSubmission(sub);
        setAnswers(sub.answers);
        setCurrentIndex(sub.answers.length);
        setIsLoadingData(false);
        return;
      }

      const newSub = await startQuizAttempt(userId, quizId, qData.questions.length);
      if (!cancelled) {
        setSubmission(newSub);
        setIsLoadingData(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, quizId, userId, reset]);

  const handleClose = useCallback(async () => {
    if (submissionRef.current && answers.length > 0 && !isFinished) {
      await savePartialProgress(submissionRef.current.id, answers);
    }
    onClose();
  }, [answers, isFinished, onClose]);

  const handleSelectOption = useCallback((idx: number) => {
    if (answerState?.revealed) return;
    if (!quizData) return;

    const question = quizData.questions[currentIndex];
    const correct = gradeAnswer(question, idx, null);

    setAnswerState({ selectedIndex: idx, answerText: null, isCorrect: correct, revealed: true });
  }, [answerState, quizData, currentIndex]);

  const handleSubmitOpenEnded = useCallback(() => {
    if (answerState?.revealed) return;
    setAnswerState({
      selectedIndex: null,
      answerText: openEndedText.trim(),
      isCorrect: false,
      revealed: true,
    });
  }, [answerState, openEndedText]);

  const handleNext = useCallback(async () => {
    if (!answerState?.revealed || !quizData || !submission) return;

    const question = quizData.questions[currentIndex];
    const entry: QuizAnswerEntry = {
      question_id: question.id,
      question_type: question.question_type,
      selected_option_index: answerState.selectedIndex,
      answer_text: answerState.answerText,
      is_correct: answerState.isCorrect,
    };

    const updatedAnswers = [...answers, entry];
    setAnswers(updatedAnswers);

    if (currentIndex < quizData.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswerState(null);
      setOpenEndedText('');
      await savePartialProgress(submission.id, updatedAnswers);
    } else {
      const gradable = getGradableCount(quizData.questions);
      const score = updatedAnswers.filter(a => a.is_correct).length;
      await completeQuiz(submission.id, updatedAnswers, score, gradable);
      setIsFinished(true);
      onCompleted?.(score, gradable);
    }
  }, [answerState, quizData, submission, currentIndex, answers, onCompleted]);

  const handleRetake = useCallback(async () => {
    if (!quizData) return;
    reset();
    const newSub = await startQuizAttempt(userId, quizId, quizData.questions.length);
    setSubmission(newSub);
  }, [quizData, userId, quizId, reset]);

  if (!isOpen) return null;

  const questions = quizData?.questions || [];
  const question = questions[currentIndex] || null;

  const getChoiceStyle = (idx: number) => {
    if (!answerState?.revealed) {
      return 'bg-gray-800/40 border-gray-700 hover:border-gray-500 cursor-pointer';
    }
    if (question && idx === question.correct_answer_index) {
      return 'bg-emerald-900/30 border-emerald-500 ring-1 ring-emerald-500/30';
    }
    if (idx === answerState.selectedIndex && !answerState.isCorrect) {
      return 'bg-red-900/30 border-red-500 ring-1 ring-red-500/30';
    }
    return 'bg-gray-800/40 border-gray-700 opacity-40';
  };

  const getLetterStyle = (idx: number) => {
    if (!answerState?.revealed) {
      return { backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary };
    }
    if (question && idx === question.correct_answer_index) {
      return { backgroundColor: '#10B981', color: '#FFF' };
    }
    if (idx === answerState.selectedIndex && !answerState.isCorrect) {
      return { backgroundColor: '#EF4444', color: '#FFF' };
    }
    return { backgroundColor: 'rgba(156,163,175,0.15)', color: 'rgba(156,163,175,0.5)' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-950 border border-gray-800 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-gray-800/80 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader className="w-8 h-8 animate-spin" style={{ color: theme.colors.primary }} />
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          </div>
        ) : isFinished ? (
          <FinishedView
            answers={answers}
            questions={questions}
            theme={theme}
            onRetake={handleRetake}
            onClose={handleClose}
          />
        ) : question ? (
          <>
            <div className="p-1.5 bg-gray-900/50">
              <div className="flex gap-1">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: idx < currentIndex
                        ? theme.colors.primary
                        : idx === currentIndex
                          ? `${theme.colors.primary}60`
                          : 'rgba(156,163,175,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="p-5">
              <p className="text-xs text-gray-500 font-medium mb-3">
                {t('grindZone.quiz.questionOf', { current: currentIndex + 1, total: questions.length })}
              </p>

              <h3 className="text-lg font-bold text-white mb-5 leading-snug">
                {question.question_text}
              </h3>

              {question.question_type === 'open_ended' ? (
                <div className="mb-4">
                  <textarea
                    value={openEndedText}
                    onChange={e => setOpenEndedText(e.target.value)}
                    disabled={!!answerState?.revealed}
                    placeholder={t('grindZone.quiz.openEndedPlaceholder', 'Ecrivez votre reponse ici...')}
                    className="w-full h-28 px-3 py-2.5 text-sm rounded-xl border border-gray-700 bg-gray-800/40 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 disabled:opacity-60"
                    style={{ '--tw-ring-color': `${theme.colors.primary}40` } as React.CSSProperties}
                  />
                  {!answerState?.revealed && (
                    <button
                      onClick={handleSubmitOpenEnded}
                      disabled={!openEndedText.trim()}
                      className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                      style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
                    >
                      {t('grindZone.quiz.submitAnswer', 'Valider')}
                    </button>
                  )}
                  {answerState?.revealed && question.correct_answer_text && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-900/15 border border-emerald-700/30">
                      <p className="text-xs font-semibold text-emerald-400 mb-1">
                        {t('grindZone.quiz.referenceAnswer', 'Reponse de reference')}
                      </p>
                      <p className="text-sm text-gray-300">{question.correct_answer_text}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {(question.options || []).map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={!!answerState?.revealed}
                      className={`relative p-3.5 rounded-xl border text-sm text-left font-medium transition-all duration-200 ${getChoiceStyle(idx)}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={getLetterStyle(idx)}
                        >
                          {answerState?.revealed && question.correct_answer_index === idx ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : answerState?.revealed && idx === answerState.selectedIndex && !answerState.isCorrect ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            String.fromCharCode(65 + idx)
                          )}
                        </span>
                        <span className="text-gray-200">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {answerState?.revealed && question.explanation && question.question_type !== 'open_ended' && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${
                  answerState.isCorrect
                    ? 'bg-emerald-900/15 text-emerald-300'
                    : 'bg-amber-900/15 text-amber-300'
                }`}>
                  {question.explanation}
                </div>
              )}

              {answerState?.revealed && (
                <button
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      {t('common.next', 'Suivant')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    t('grindZone.quiz.seeResults')
                  )}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <BookOpen className="w-10 h-10 text-gray-600" />
            <p className="text-sm text-gray-500">{t('grindZone.quiz.noQuestions', 'Aucune question disponible')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface FinishedViewProps {
  answers: QuizAnswerEntry[];
  questions: GrindZoneQuizQuestion[];
  theme: GameTheme;
  onRetake: () => void;
  onClose: () => void;
}

const FinishedView: React.FC<FinishedViewProps> = ({
  answers,
  questions,
  theme,
  onRetake,
  onClose,
}) => {
  const { t } = useTranslation();

  const gradable = getGradableCount(questions);
  const correctCount = answers.filter(a => a.is_correct).length;
  const passed = gradable > 0 ? correctCount / gradable >= 0.8 : true;

  return (
    <div className="p-6 text-center">
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

      <h3 className="text-2xl font-bold text-white mb-2">
        {correctCount}/{gradable}
      </h3>
      <p className="text-lg font-semibold mb-1" style={{ color: passed ? '#10B981' : '#F59E0B' }}>
        {passed ? t('grindZone.quiz.passed') : t('grindZone.quiz.failed')}
      </p>
      <p className="text-sm text-gray-400 mb-6">
        {passed
          ? t('grindZone.quiz.passedDesc')
          : t('grindZone.quiz.failedDesc')}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onRetake}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
        >
          {passed ? t('grindZone.quiz.retake', 'Recommencer') : t('grindZone.quiz.tryAgain')}
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          {t('grindZone.quiz.backToPlaylist')}
        </button>
      </div>
    </div>
  );
};

export default QuizPlayerModal;
