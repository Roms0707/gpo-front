import { supabase } from '../lib/supabase';
import type { GrindZoneQuizSubmission, QuizAnswerEntry } from '../types/grindZoneQuiz';

export async function fetchUserSubmission(
  userId: string,
  quizId: string
): Promise<GrindZoneQuizSubmission | null> {
  const { data, error } = await supabase
    .from('grind_zone_quiz_submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .maybeSingle();

  if (error) {
    console.error('[quizSubmissionService] fetchUserSubmission error:', error);
    return null;
  }
  return data;
}

export async function fetchUserSubmissions(
  userId: string,
  quizIds: string[]
): Promise<GrindZoneQuizSubmission[]> {
  if (!quizIds.length) return [];

  const { data, error } = await supabase
    .from('grind_zone_quiz_submissions')
    .select('*')
    .eq('user_id', userId)
    .in('quiz_id', quizIds);

  if (error) {
    console.error('[quizSubmissionService] fetchUserSubmissions error:', error);
    return [];
  }
  return (data || []) as GrindZoneQuizSubmission[];
}

export async function startQuizAttempt(
  userId: string,
  quizId: string,
  totalQuestions: number
): Promise<GrindZoneQuizSubmission | null> {
  const { data, error } = await supabase
    .from('grind_zone_quiz_submissions')
    .upsert(
      {
        user_id: userId,
        quiz_id: quizId,
        score: 0,
        total_questions: totalQuestions,
        is_completed: false,
        answers: [],
        started_at: new Date().toISOString(),
        completed_at: null,
      },
      { onConflict: 'user_id,quiz_id' }
    )
    .select()
    .maybeSingle();

  if (error) {
    console.error('[quizSubmissionService] startQuizAttempt error:', error);
    return null;
  }
  return data;
}

export async function savePartialProgress(
  submissionId: string,
  answers: QuizAnswerEntry[]
): Promise<boolean> {
  const { error } = await supabase
    .from('grind_zone_quiz_submissions')
    .update({
      answers,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error('[quizSubmissionService] savePartialProgress error:', error);
    return false;
  }
  return true;
}

export async function completeQuiz(
  submissionId: string,
  answers: QuizAnswerEntry[],
  score: number,
  totalQuestions: number
): Promise<boolean> {
  const { error } = await supabase
    .from('grind_zone_quiz_submissions')
    .update({
      answers,
      score,
      total_questions: totalQuestions,
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    console.error('[quizSubmissionService] completeQuiz error:', error);
    return false;
  }
  return true;
}
