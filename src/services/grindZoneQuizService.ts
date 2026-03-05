import { supabase } from '../lib/supabase';
import type { GrindZoneQuiz, GrindZoneQuizQuestion, QuizWithQuestions } from '../types/grindZoneQuiz';

export async function fetchQuizForRubric(
  projectConfigId: string,
  rubricId: string,
  gameId?: string | null
): Promise<GrindZoneQuiz | null> {
  let query = supabase
    .from('grind_zone_quizzes')
    .select('*')
    .eq('project_config_id', projectConfigId)
    .eq('rubric_id', rubricId)
    .eq('status', 'published');

  if (gameId) {
    query = query.eq('game_id', gameId);
  }

  const { data, error } = await query.limit(1).maybeSingle();

  if (error) {
    console.error('[grindZoneQuizService] fetchQuizForRubric error:', error);
    return null;
  }
  return data;
}

export async function fetchQuizWithQuestions(
  quizId: string
): Promise<QuizWithQuestions | null> {
  const { data: quiz, error: quizError } = await supabase
    .from('grind_zone_quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle();

  if (quizError || !quiz) {
    console.error('[grindZoneQuizService] fetchQuizWithQuestions quiz error:', quizError);
    return null;
  }

  const { data: questions, error: questionsError } = await supabase
    .from('grind_zone_quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('display_order', { ascending: true });

  if (questionsError) {
    console.error('[grindZoneQuizService] fetchQuizWithQuestions questions error:', questionsError);
    return null;
  }

  return {
    quiz,
    questions: (questions || []) as GrindZoneQuizQuestion[],
  };
}

export async function fetchQuizzesForRubrics(
  projectConfigId: string,
  rubricIds: string[],
  gameId?: string | null
): Promise<GrindZoneQuiz[]> {
  if (!rubricIds.length) return [];

  let query = supabase
    .from('grind_zone_quizzes')
    .select('*')
    .eq('project_config_id', projectConfigId)
    .eq('status', 'published')
    .in('rubric_id', rubricIds);

  if (gameId) {
    query = query.eq('game_id', gameId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[grindZoneQuizService] fetchQuizzesForRubrics error:', error);
    return [];
  }
  return (data || []) as GrindZoneQuiz[];
}
