import { LocalizedText } from './localization'

export type TriviaQuestion = {
  id: string
  authorId?: string
  question: LocalizedText
  answers: readonly [LocalizedText, LocalizedText, LocalizedText]
  correctAnswer: 0 | 1 | 2
}

/**
 * DEV ONLY fallback used when the authoritative server is not configured
 * or when running in pure local mode.
 * Intentionally obvious so it is never mistaken for production data.
 */
export const QUESTIONS: readonly TriviaQuestion[] = [
  {
    id: 'dev-local-1',
    question: {
      fr: 'MODE DEV LOCAL — choisissez la réponse A',
      en: 'DEV LOCAL MODE — pick answer A',
      es: 'MODO DEV LOCAL — elige la respuesta A',
      de: 'DEV LOCAL MODUS — wähle Antwort A'
    },
    answers: [
      { fr: 'Réponse A (DEV)', en: 'Answer A (DEV)', es: 'Respuesta A (DEV)', de: 'Antwort A (DEV)' },
      { fr: 'Réponse B (DEV)', en: 'Answer B (DEV)', es: 'Respuesta B (DEV)', de: 'Antwort B (DEV)' },
      { fr: 'Réponse C (DEV)', en: 'Answer C (DEV)', es: 'Respuesta C (DEV)', de: 'Antwort C (DEV)' }
    ],
    correctAnswer: 0
  },
  {
    id: 'dev-local-2',
    question: {
      fr: 'MODE DEV LOCAL — choisissez la réponse B',
      en: 'DEV LOCAL MODE — pick answer B',
      es: 'MODO DEV LOCAL — elige la respuesta B',
      de: 'DEV LOCAL MODUS — wähle Antwort B'
    },
    answers: [
      { fr: 'Légume 1', en: 'Veg 1', es: 'Verdura 1', de: 'Gemüse 1' },
      { fr: 'Légume 2', en: 'Veg 2', es: 'Verdura 2', de: 'Gemüse 2' },
      { fr: 'Légume 3', en: 'Veg 3', es: 'Verdura 3', de: 'Gemüse 3' }
    ],
    correctAnswer: 1
  },
  {
    id: 'dev-local-3',
    question: {
      fr: 'MODE DEV LOCAL — choisissez la réponse C',
      en: 'DEV LOCAL MODE — pick answer C',
      es: 'MODO DEV LOCAL — elige la respuesta C',
      de: 'DEV LOCAL MODUS — wähle Antwort C'
    },
    answers: [
      { fr: 'Vote 1', en: 'Vote 1', es: 'Voto 1', de: 'Stimme 1' },
      { fr: 'Vote 2', en: 'Vote 2', es: 'Voto 2', de: 'Stimme 2' },
      { fr: 'Vote 3', en: 'Vote 3', es: 'Voto 3', de: 'Stimme 3' }
    ],
    correctAnswer: 2
  }
]

export const localQuestions = QUESTIONS
