export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'open_ended';

export interface GrindZoneQuiz {
  id: string;
  rubric_id: string;
  rubric_name: string | null;
  project_config_id: string;
  game_id: string | null;
  title: string;
  status: string;
  video_count: number;
  language: string;
  source_quiz_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrindZoneQuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuizQuestionType;
  options: string[] | null;
  correct_answer_index: number | null;
  correct_answer_text: string | null;
  explanation: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface QuizWithQuestions {
  quiz: GrindZoneQuiz;
  questions: GrindZoneQuizQuestion[];
}

export interface QuizAnswerEntry {
  question_id: string;
  question_type: QuizQuestionType;
  selected_option_index: number | null;
  answer_text: string | null;
  is_correct: boolean;
}

export interface GrindZoneQuizSubmission {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  is_completed: boolean;
  answers: QuizAnswerEntry[];
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RubricQuizStatus {
  quiz: GrindZoneQuiz | null;
  submission: GrindZoneQuizSubmission | null;
  status: 'no_quiz' | 'available' | 'in_progress' | 'completed';
}
