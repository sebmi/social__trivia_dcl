import { engine, Transform } from '@dcl/sdk/ecs'
import { isStateSyncronized, myProfile } from '@dcl/sdk/network'
import { getPlayer } from '@dcl/sdk/players'
import { setCurrentLanguage, SupportedLanguage } from './localization'
import { AnswerIndex, PlatformManager } from './platforms'
import { GamePhase, GameViewState, TriviaController, RoundResult, SocialLink } from './game'
import { triviaRoom } from './messages'
import { updateTriviaAudio } from './audio'

type ServerPlayerState = {
  score: number
  answer: number | null
  result: string | null
  socialVoteTarget: string | null
  language: string
  displayName?: string
  questionsSubmitted: number
}

type ServerStatePayload = {
  phase: GamePhase
  questionIndex: number
  totalQuestions: number
  phaseStartedAt: number
  phaseDeadline: number
  socialSummary: string | null
  players: Record<string, ServerPlayerState>
  question: GameViewState['question']
  collectingSlotsLeft: number
  collectingSecondsLeft: number
}

export class ServerTriviaGame implements TriviaController {
  private readonly platforms: PlatformManager
  private playerId = myProfile.userId
  private state = this.createEmptyState()
  private selectedAnswer: AnswerIndex | null = null
  private started = false
  private selectedLanguage: SupportedLanguage | null = null

  constructor(platforms: PlatformManager) {
    this.platforms = platforms

    triviaRoom.onMessage('identity', (data) => {
      this.playerId = data.playerId
      console.log(`[CLIENT] Connected to Trivia server as ${this.playerId}`)
    })

    triviaRoom.onMessage('state', (data) => {
      this.applyServerState(data.value)
    })

    triviaRoom.onReady((ready) => {
      if (ready) this.sendReady()
    })
  }

  selectLanguage(language: SupportedLanguage): void {
    setCurrentLanguage(language)
    this.selectedLanguage = language
    this.selectedAnswer = null
    this.started = true
    this.state = this.createEmptyState()
    this.state.phase = 'LOBBY'
    this.sendReady()
  }

  playAgain(): void {
    this.selectedAnswer = null
    this.state = this.createEmptyState()
    this.state.phase = 'LOBBY'
    void triviaRoom.send('restart', {})
  }

  startGame(): void {
    if (!this.started || this.state.phase !== 'LOBBY') return
    void triviaRoom.send('startGame', {})
  }

    leaveLobby(): void {
    if (!this.started || this.state.phase !== 'LOBBY') return
    void triviaRoom.send('leaveLobby', {})
    this.selectedLanguage = null
    this.started = false
    this.selectedAnswer = null
    this.state = this.createEmptyState()
    // createEmptyState() met déjà phase: 'LANGUAGE_SELECTION'
  }

  selectAnswer(answer: AnswerIndex): void {
    if (!this.started || this.state.phase !== 'QUESTION') return
    this.selectedAnswer = answer
    this.platforms.showSelection(answer)
    void triviaRoom.send('answer', { answer })
  }

  selectSocialVote(targetPlayerId: string): void {
    if (!this.started || this.state.phase !== 'SOCIAL_VOTE') return
    if (targetPlayerId === this.playerId) return
    void triviaRoom.send('socialVote', { targetPlayerId })
  }

  submitQuestion(
    question: string,
    answerA: string,
    answerB: string,
    answerC: string,
    correctAnswer: 0 | 1 | 2
  ): void {
    if (!this.started || this.state.phase !== 'COLLECTING') return
    if (this.state.collectingSlotsLeft <= 0) return

    void triviaRoom.send('submitQuestion', {
      question: question.trim(),
      answerA: answerA.trim(),
      answerB: answerB.trim(),
      answerC: answerC.trim(),
      correctAnswer
    })
  }

update(): void {
  updateTriviaAudio(this.state.phase, this.getRemainingSeconds())

  if (!this.started || !isStateSyncronized()) return
    if (this.state.phase !== 'QUESTION') return
    if (!Transform.has(engine.PlayerEntity)) return

    const answer = this.platforms.getAnswerAtPosition(Transform.get(engine.PlayerEntity).position)
    if (answer === null) return

    if (answer !== this.selectedAnswer) {
      this.selectedAnswer = answer
      this.platforms.showSelection(answer)
      void triviaRoom.send('answer', { answer })
    }
  }

  getPhase(): GamePhase {
    return this.state.phase
  }

  getRemainingSeconds(): number {
  return this.state.phase === 'COLLECTING'
    ? this.state.collectingSecondsLeft
    : this.state.remainingSeconds
}

  getViewState(): GameViewState {
    return { ...this.state, selectedAnswer: this.selectedAnswer }
  }

  // ─────────────────────────────────────────────────────────────
  // Internal
  // ─────────────────────────────────────────────────────────────

  private applyServerState(serializedState: string): void {
    try {
      const parsed = JSON.parse(serializedState) as ServerStatePayload & {
        socialLinks?: SocialLink[]
      }
      const player = parsed.players[this.playerId]
      const selectedAnswer = player?.answer

      // Keep LANGUAGE_SELECTION until the player has chosen a language
      const phase = !this.selectedLanguage ? 'LANGUAGE_SELECTION' : parsed.phase
      const previousQuestionId = this.state.question?.id

      const remainingSeconds =
        parsed.phase === 'QUESTION' || parsed.phase === 'SOCIAL_VOTE'
          ? Math.max(0, Math.ceil((parsed.phaseDeadline - Date.now()) / 1000))
          : 0

      this.state = {
        phase,
        question: parsed.question,
        questionNumber: parsed.question ? parsed.questionIndex + 1 : 0,
        totalQuestions: parsed.totalQuestions,
        remainingSeconds,
        selectedAnswer:
          selectedAnswer === null || selectedAnswer === undefined
            ? null
            : (selectedAnswer as AnswerIndex),
        score: player?.score ?? 0,
        result: this.toRoundResult(player?.result),
        players: Object.entries(parsed.players).map(([playerId, value]) => ({
          playerId,
          displayName: value.displayName || playerId.slice(0, 10),
          score: value.score,
          isSelf: playerId === this.playerId,
          avatarColor: playerId.length % 6
        })),
        socialSummary: parsed.socialSummary,
        socialLinks: parsed.socialLinks ?? [],
        socialVoteTarget: player?.socialVoteTarget ?? null,
        collectingSlotsLeft: parsed.collectingSlotsLeft ?? 0,
        collectingSecondsLeft: parsed.collectingSecondsLeft ?? 0,
        questionsSubmittedByMe: player?.questionsSubmitted ?? 0
      }

      this.selectedAnswer = this.state.selectedAnswer

      // Only reset platforms when the question actually changes (avoids flash)
      if (this.state.question && this.state.question.id !== previousQuestionId) {
        this.platforms.setQuestion(this.state.question)
      }

      if (this.state.phase === 'QUESTION' && this.selectedAnswer !== null) {
        this.platforms.showSelection(this.selectedAnswer)
      }

      if (this.state.phase === 'REVEAL' || this.state.phase === 'SCORE') {
        const correctAnswer = this.state.question?.correctAnswer
        if (correctAnswer !== undefined && correctAnswer !== null) {
          this.platforms.showCorrectAnswer(correctAnswer, this.selectedAnswer)
        }
      }
    } catch {
      console.error('[CLIENT] Invalid Trivia server state')
    }
  }

  private sendReady(): void {
    if (!this.started || !this.selectedLanguage) return
    const displayName = resolveLocalDisplayName()
    console.log(`[CLIENT] Sending ready: ${this.selectedLanguage} as ${displayName}`)
    void triviaRoom.send('ready', {
      language: this.selectedLanguage,
      displayName
    })
  }

  private createEmptyState(): GameViewState {
    return {
      phase: 'LANGUAGE_SELECTION',
      question: null,
      questionNumber: 0,
      totalQuestions: 0,
      remainingSeconds: 0,
      selectedAnswer: null,
      score: 0,
      result: null,
      players: [],
      socialSummary: null,
      socialLinks: [],
      socialVoteTarget: null,
      collectingSlotsLeft: 12,
      collectingSecondsLeft: 60,
      questionsSubmittedByMe: 0
    }
  }

  private toRoundResult(value: string | null | undefined): RoundResult {
    if (value === 'correct' || value === 'wrong' || value === 'timeUp') return value
    return null
  }
}

/** Prefer in-world player name (same source as the model scene). */
function resolveLocalDisplayName(): string {
  try {
    const player = getPlayer({ userId: myProfile.userId })
    const name = player?.name?.trim()
    if (name) return name.slice(0, 24)
  } catch {
    // getPlayer can throw if player data is not ready yet
  }
  const profile = myProfile as { name?: string; displayName?: string; userId: string }
  const fallback = profile.name?.trim() || profile.displayName?.trim()
  if (fallback) return fallback.slice(0, 24)
  return profile.userId.replace(/^0x/, '').slice(0, 8)
}
