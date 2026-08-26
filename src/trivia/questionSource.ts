import { localQuestions, TriviaQuestion } from './questions'

/**
 * DEV ONLY fallback for local preview/testing.
 * The authoritative source of questions and game state must live on the backend server.
 */
export interface QuestionSource {
  getQuestions(): readonly TriviaQuestion[]
}

export class LocalQuestionSource implements QuestionSource {
  getQuestions(): readonly TriviaQuestion[] {
    return localQuestions
  }
}
