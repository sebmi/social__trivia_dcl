import { engine, Transform } from '@dcl/sdk/ecs'
import { setCurrentLanguage, SupportedLanguage } from './localization'
import { AnswerIndex, PlatformManager } from './platforms'
import { QuestionSource } from './questionSource'
import { TriviaQuestion } from './questions'
import { ScoreStore } from './score'

export type GamePhase =
  | 'LANGUAGE_SELECTION'
  | 'LOBBY'
  | 'COLLECTING'
  | 'WAITING'
  | 'QUESTION'
  | 'LOCKED'
  | 'SOCIAL_VOTE'
  | 'REVEAL'
  | 'SCORE'
  | 'GAME_OVER'

export type RoundResult = 'correct' | 'wrong' | 'timeUp' | null

export type SocialPlayer = {
  playerId: string
  displayName: string
  score: number
  isSelf: boolean
  avatarColor: number
}

export type SocialLink = {
  sourceId: string
  targetId: string
  sourceName: string
  targetName: string
  kind: 'MATCH' | 'FRIENDZONED' | 'IGNORED'
}

export type GameViewState = {
  phase: GamePhase
  question: TriviaQuestion | null
  questionNumber: number
  totalQuestions: number
  remainingSeconds: number
  selectedAnswer: AnswerIndex | null
  score: number
  result: RoundResult
  players: SocialPlayer[]
  socialSummary: string | null
  socialLinks: SocialLink[]
  socialVoteTarget: string | null
  /** COLLECTING only */
  collectingSlotsLeft: number
  collectingSecondsLeft: number
  questionsSubmittedByMe: number
}

export interface TriviaController {
  selectLanguage(language: SupportedLanguage): void
  playAgain(): void
  startGame(): void
  leaveLobby(): void
  selectAnswer(answer: AnswerIndex): void
  selectSocialVote(targetPlayerId: string): void
  /** COLLECTING : submit a custom question */
  submitQuestion(
    question: string,
    answerA: string,
    answerB: string,
    answerC: string,
    correctAnswer: 0 | 1 | 2
  ): void
  update(now?: number): void
  getPhase(): GamePhase
  getViewState(now?: number): GameViewState
}

const QUESTION_DURATION_MS = 15_000
const WAITING_DURATION_MS = 1_200
const LOCKED_DURATION_MS = 400
const REVEAL_DURATION_MS = 2_600
const SCORE_DURATION_MS = 1_600
const POINTS_PER_CORRECT_ANSWER = 100

/**
 * Local fallback controller (used only when authoritative server is not present).
 * Does not support player-created questions – uses the static bank.
 */
export class TriviaGame implements TriviaController {
  private readonly questions: readonly TriviaQuestion[]
  private readonly score = new ScoreStore()
  private phase: GamePhase = 'LANGUAGE_SELECTION'
  private phaseStartedAt = Date.now()
  private questionStartedAt = 0
  private questionIndex = 0
  private selectedAnswer: AnswerIndex | null = null
  private result: RoundResult = null

  constructor(
    questionSource: QuestionSource,
    private readonly platforms: PlatformManager
  ) {
    this.questions = questionSource.getQuestions()
  }

  selectLanguage(language: SupportedLanguage): void {
    if (this.phase !== 'LANGUAGE_SELECTION') return
    setCurrentLanguage(language)
    this.resetSession()
    this.setPhase('WAITING')
  }

  playAgain(): void {
    if (this.phase !== 'GAME_OVER') return
    this.resetSession()
    this.setPhase('WAITING')
  }

  startGame(): void {
    // Local fallback – no multiplayer lobby
  }

    leaveLobby(): void {
    // Local fallback – nothing to leave
  }
  
  selectAnswer(answer: AnswerIndex): void {
    if (this.phase !== 'QUESTION') return
    if (answer === this.selectedAnswer) return
    this.selectedAnswer = answer
    this.platforms.showSelection(answer)
  }

  selectSocialVote(_targetPlayerId: string): void {
    // Local fallback does not model social vote
  }

  submitQuestion(
    _question: string,
    _answerA: string,
    _answerB: string,
    _answerC: string,
    _correctAnswer: 0 | 1 | 2
  ): void {
    // Local fallback does not accept custom questions
  }

  update(now = Date.now()): void {
    switch (this.phase) {
      case 'WAITING':
        if (now - this.phaseStartedAt >= WAITING_DURATION_MS) this.startQuestion(now)
        break
      case 'QUESTION':
        if (now - this.questionStartedAt >= QUESTION_DURATION_MS) {
          this.setPhase('LOCKED', now)
        } else {
          this.updatePlayerSelection()
        }
        break
      case 'LOCKED':
        if (now - this.phaseStartedAt >= LOCKED_DURATION_MS) this.revealAnswer(now)
        break
      case 'REVEAL':
        if (now - this.phaseStartedAt >= REVEAL_DURATION_MS) this.setPhase('SCORE', now)
        break
      case 'SCORE':
        if (now - this.phaseStartedAt >= SCORE_DURATION_MS) this.advanceQuestion(now)
        break
    }
  }

  getPhase(): GamePhase {
    return this.phase
  }

  getViewState(now = Date.now()): GameViewState {
    const remainingMilliseconds = Math.max(0, QUESTION_DURATION_MS - (now - this.questionStartedAt))

    return {
      phase: this.phase,
      question: this.questions[this.questionIndex] ?? null,
      questionNumber: Math.min(this.questionIndex + 1, this.questions.length),
      totalQuestions: this.questions.length,
      remainingSeconds: this.phase === 'QUESTION' ? Math.ceil(remainingMilliseconds / 1000) : 0,
      selectedAnswer: this.selectedAnswer,
      score: this.score.getScore(),
      result: this.result,
      players: [],
      socialSummary: null,
      socialLinks: [],
      socialVoteTarget: null,
      collectingSlotsLeft: 0,
      collectingSecondsLeft: 0,
      questionsSubmittedByMe: 0
    }
  }

  private startQuestion(now: number): void {
    const question = this.questions[this.questionIndex]
    if (!question) {
      this.setPhase('GAME_OVER', now)
      return
    }
    this.selectedAnswer = null
    this.result = null
    this.platforms.setQuestion(question)
    this.questionStartedAt = now
    this.setPhase('QUESTION', now)
  }

  private updatePlayerSelection(): void {
    if (!Transform.has(engine.PlayerEntity)) return
    const answer = this.platforms.getAnswerAtPosition(Transform.get(engine.PlayerEntity).position)
    if (answer === null || answer === this.selectedAnswer) return
    this.selectedAnswer = answer
    this.platforms.showSelection(answer)
  }

  private revealAnswer(now: number): void {
    const question = this.questions[this.questionIndex]
    if (!question) return

    if (this.selectedAnswer === null) {
      this.result = 'timeUp'
    } else if (this.selectedAnswer === question.correctAnswer) {
      this.result = 'correct'
      this.score.addScore(POINTS_PER_CORRECT_ANSWER)
    } else {
      this.result = 'wrong'
    }

    this.platforms.showCorrectAnswer(question.correctAnswer, this.selectedAnswer)
    this.setPhase('REVEAL', now)
  }

  private advanceQuestion(now: number): void {
    this.questionIndex += 1
    if (this.questionIndex >= this.questions.length) {
      this.setPhase('GAME_OVER', now)
    } else {
      this.startQuestion(now)
    }
  }

  private resetSession(): void {
    this.questionIndex = 0
    this.questionStartedAt = 0
    this.selectedAnswer = null
    this.result = null
    this.score.resetScore()
    this.platforms.showSelection(null)
  }

  private setPhase(phase: GamePhase, now = Date.now()): void {
    this.phase = phase
    this.phaseStartedAt = now
  }
}
