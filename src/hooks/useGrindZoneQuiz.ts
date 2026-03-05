import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchQuizzesForRubrics } from '../services/grindZoneQuizService';
import { fetchUserSubmissions } from '../services/grindZoneQuizSubmissionService';
import type { GrindZoneQuiz, GrindZoneQuizSubmission, RubricQuizStatus } from '../types/grindZoneQuiz';

export function useGrindZoneQuiz(
  projectConfigUuid: string,
  rubricIds: string[],
  userId: string | null,
  gameId?: string | null
) {
  const [quizzes, setQuizzes] = useState<GrindZoneQuiz[]>([]);
  const [submissions, setSubmissions] = useState<GrindZoneQuizSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const stableRubricIds = useMemo(() => rubricIds.join(','), [rubricIds]);

  const load = useCallback(async () => {
    const ids = stableRubricIds.split(',').filter(Boolean);
    if (!projectConfigUuid || !ids.length) {
      setQuizzes([]);
      setSubmissions([]);
      return;
    }

    setIsLoading(true);
    try {
      const quizData = await fetchQuizzesForRubrics(projectConfigUuid, ids, gameId);
      setQuizzes(quizData);

      if (userId && quizData.length > 0) {
        const quizIds = quizData.map(q => q.id);
        const subData = await fetchUserSubmissions(userId, quizIds);
        setSubmissions(subData);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('[useGrindZoneQuiz] load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectConfigUuid, stableRubricIds, userId, gameId]);

  useEffect(() => {
    load();
  }, [load]);

  const quizStatusMap = useMemo(() => {
    const map = new Map<string, RubricQuizStatus>();

    for (const quiz of quizzes) {
      const submission = submissions.find(s => s.quiz_id === quiz.id) || null;
      let status: RubricQuizStatus['status'] = 'available';

      if (submission) {
        status = submission.is_completed ? 'completed' : 'in_progress';
      }

      map.set(quiz.rubric_id, { quiz, submission, status });
    }

    return map;
  }, [quizzes, submissions]);

  return { quizStatusMap, isLoading, refresh: load };
}
