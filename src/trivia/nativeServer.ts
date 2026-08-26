import { engine } from '@dcl/sdk/ecs'
import { isServer } from '@dcl/sdk/network'
import { triviaRoom } from './messages'
import { TriviaQuestion } from './questions'
import { LocalizedText, SupportedLanguage } from './localization'
import { onLeaveSceneObservable } from '@dcl/sdk/observables'

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const MAX_QUESTIONS = 12
const COLLECTING_DURATION_MS = 120_000
const QUESTION_DURATION_MS = 15_000
const SOCIAL_VOTE_DURATION_MS = 10_000
const REVEAL_DURATION_MS = 2_600
const SCORE_DURATION_MS = 1_600
const WAITING_AFTER_COLLECT_MS = 1_500

const MIN_QUESTION_LENGTH = 8
const MAX_QUESTION_LENGTH = 180
const MIN_ANSWER_LENGTH = 1
const MAX_ANSWER_LENGTH = 80

/** Empty for now – can be filled later with forbidden words */
const FORBIDDEN_WORDS: string[] = []

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type PlayerState = {
  score: number
  answer: number | null
  answerAt: number | null
  result: string | null
  socialVoteTarget: string | null
  language: string
  displayName: string
  questionsSubmitted: number
}

type ServerPhase =
  | 'LOBBY'
  | 'COLLECTING'
  | 'WAITING'
  | 'QUESTION'
  | 'SOCIAL_VOTE'
  | 'REVEAL'
  | 'GAME_OVER'

type ServerState = {
  phase: ServerPhase
  questionIndex: number
  totalQuestions: number
  phaseStartedAt: number
  phaseDeadline: number
  socialSummary: string | null
  players: Record<string, PlayerState>
  questionPool: TriviaQuestion[]
}

// ─────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────

let state: ServerState
let lastBroadcastAt = 0
let questionIdCounter = 0

type SocialLinkPayload = {
  sourceId: string
  targetId: string
  sourceName: string
  targetName: string
  kind: 'MATCH' | 'FRIENDZONED' | 'IGNORED'
}

let lastSocialLinks: SocialLinkPayload[] = []

// ─────────────────────────────────────────────────────────────
// Public entry
// ─────────────────────────────────────────────────────────────

export function initTriviaServer(): void {
  if (!isServer()) return

  const now = Date.now()
  state = {
    phase: 'LOBBY',
    questionIndex: 0,
    totalQuestions: 0,
    phaseStartedAt: now,
    phaseDeadline: 0,
    socialSummary: null,
    players: {},
    questionPool: []
  }

  triviaRoom.onMessage('ready', (data, context) => {
    if (!context) return
    console.log(`[SERVER] Player ready: ${context.from} (${data.language}) name=${data.displayName}`)

    const player = getOrCreatePlayer(context.from)
    player.language = data.language || 'en'
    if (data.displayName && String(data.displayName).trim()) {
      player.displayName = String(data.displayName).trim().slice(0, 24)
    }

    
    void triviaRoom.send('identity', { playerId: context.from }, { to: [context.from] })
    // Stay in LOBBY until someone presses Start
    broadcastState()
  })

  triviaRoom.onMessage('startGame', (_data, context) => {
    if (!context) return
    if (state.phase !== 'LOBBY') {
      console.log(`[SERVER] startGame ignored – phase is ${state.phase}`)
      return
    }
    console.log(`[SERVER] Game started by ${context.from}`)
    startCollecting(Date.now())
  })

  triviaRoom.onMessage('submitQuestion', (data, context) => {
    if (!context) {
      console.log('[SERVER] submitQuestion: no context')
      return
    }
    if (state.phase !== 'COLLECTING') {
      console.log(`[SERVER] submitQuestion rejected – phase is ${state.phase}`)
      return
    }
    handleSubmitQuestion(context.from, data)
  })

  triviaRoom.onMessage('answer', (data, context) => {
    if (!context || state.phase !== 'QUESTION') return
    if (data.answer < 0 || data.answer > 2) return
    const player = getOrCreatePlayer(context.from)
    // Allow changing answer until time is up
    player.answer = data.answer
    player.answerAt = Date.now()
    broadcastState()
  })

  triviaRoom.onMessage('socialVote', (data, context) => {
    if (!context || state.phase !== 'SOCIAL_VOTE') return
    if (!state.players[data.targetPlayerId]) return
    if (data.targetPlayerId === context.from) return
    getOrCreatePlayer(context.from).socialVoteTarget = data.targetPlayerId
    broadcastState()
  })

  triviaRoom.onMessage('restart', (_data, context) => {
    if (!context) return
    console.log(`[SERVER] Restart requested by ${context.from}`)
    resetGame()
    getOrCreatePlayer(context.from)
    // Back to LOBBY – wait for Start again
    broadcastState()
  })

  triviaRoom.onMessage('leaveLobby', (_data, context) => {
    if (!context) return
    if (state.phase !== 'LOBBY') {
      console.log(`[SERVER] leaveLobby ignored – phase is ${state.phase}`)
      return
    }
    removePlayer(context.from, 'leaveLobby')
  })

    onLeaveSceneObservable.add((player) => {
    const playerId = player.userId
    if (!playerId || !state.players[playerId]) return

    // Même effet que Quitter, quel que soit le moment
    removePlayer(playerId, 'leave-scene')
  })

  engine.addSystem(() => updateServer(Date.now()))
  broadcastState()
  console.log('[SERVER] Trivia authoritative server initialized (LOBBY)')
}

// ─────────────────────────────────────────────────────────────
// Question submission & validation
// ─────────────────────────────────────────────────────────────

function handleSubmitQuestion(
  playerId: string,
  data: {
    question: string
    answerA: string
    answerB: string
    answerC: string
    correctAnswer: number
  }
): void {
  console.log(`[SERVER] submitQuestion from ${playerId}:`, JSON.stringify(data).slice(0, 140))

  if (state.questionPool.length >= MAX_QUESTIONS) {
    console.log(`[SERVER] Question rejected – pool full (${MAX_QUESTIONS})`)
    return
  }

  const q = (data.question || '').trim()
  const a = (data.answerA || '').trim()
  const b = (data.answerB || '').trim()
  const c = (data.answerC || '').trim()
  const correct = data.correctAnswer

  if (
    q.length < MIN_QUESTION_LENGTH ||
    q.length > MAX_QUESTION_LENGTH ||
    a.length < MIN_ANSWER_LENGTH ||
    a.length > MAX_ANSWER_LENGTH ||
    b.length < MIN_ANSWER_LENGTH ||
    b.length > MAX_ANSWER_LENGTH ||
    c.length < MIN_ANSWER_LENGTH ||
    c.length > MAX_ANSWER_LENGTH ||
    correct < 0 ||
    correct > 2 ||
    !Number.isInteger(correct)
  ) {
    console.log(
      `[SERVER] Question rejected – validation failed from ${playerId} (q=${q.length}, a=${a.length}, b=${b.length}, c=${c.length}, correct=${correct})`
    )
    return
  }

  const lower = `${q} ${a} ${b} ${c}`.toLowerCase()
  for (const word of FORBIDDEN_WORDS) {
    if (word && lower.includes(word.toLowerCase())) {
      console.log(`[SERVER] Question rejected – forbidden word from ${playerId}`)
      return
    }
  }

  const player = getOrCreatePlayer(playerId)
  const lang = (player.language as SupportedLanguage) || 'en'

  const makeLocalized = (text: string): LocalizedText => {
    const obj: LocalizedText = { en: text }
    obj[lang] = text
    return obj
  }

  questionIdCounter += 1
  const newQuestion: TriviaQuestion = {
    id: `q-${questionIdCounter}-${playerId.slice(0, 8)}`,
    authorId: playerId,
    question: makeLocalized(q),
    answers: [makeLocalized(a), makeLocalized(b), makeLocalized(c)],
    correctAnswer: correct as 0 | 1 | 2
  }

  state.questionPool.push(newQuestion)
  player.questionsSubmitted += 1
  state.totalQuestions = state.questionPool.length

  console.log(
    `[SERVER] Question ACCEPTED from ${playerId} → pool ${state.questionPool.length}/${MAX_QUESTIONS}`
  )

  if (state.questionPool.length >= MAX_QUESTIONS) {
    finishCollecting(Date.now())
  } else {
    broadcastState()
  }
}

// ─────────────────────────────────────────────────────────────
// Phase transitions
// ─────────────────────────────────────────────────────────────

function startCollecting(now: number): void {
  state.phase = 'COLLECTING'
  state.phaseStartedAt = now
  state.phaseDeadline = now + COLLECTING_DURATION_MS
  state.questionPool = []
  state.totalQuestions = 0
  state.questionIndex = 0
  state.socialSummary = null
  questionIdCounter = 0

  for (const player of Object.values(state.players)) {
    player.questionsSubmitted = 0
    player.answer = null
    player.result = null
    player.socialVoteTarget = null
  }

  console.log('[SERVER] → COLLECTING started (60s)')
  broadcastState()
}

function finishCollecting(now: number): void {
  if (state.questionPool.length === 0) {
    // Extend once by 30s instead of looping forever
    console.log('[SERVER] No questions – extending collecting by 30s')
    state.phaseDeadline = now + 30_000
    broadcastState()
    return
  }

  for (let i = state.questionPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[state.questionPool[i], state.questionPool[j]] = [state.questionPool[j], state.questionPool[i]]
  }

  state.totalQuestions = state.questionPool.length
  state.questionIndex = 0
  state.phase = 'WAITING'
  state.phaseStartedAt = now
  state.phaseDeadline = now + WAITING_AFTER_COLLECT_MS
  state.socialSummary = null

  console.log(`[SERVER] Collecting finished – ${state.totalQuestions} questions ready`)
  broadcastState()
}

function startQuestion(now: number): void {
  if (state.questionIndex >= state.questionPool.length) {
    state.phase = 'GAME_OVER'
    state.phaseStartedAt = now
    state.phaseDeadline = 0
    broadcastState()
    return
  }

  state.phase = 'QUESTION'
  state.phaseStartedAt = now
  state.phaseDeadline = now + QUESTION_DURATION_MS
  state.socialSummary = null

  for (const player of Object.values(state.players)) {
    player.answer = null
    player.answerAt = null
    player.result = null
    player.socialVoteTarget = null
  }

  console.log(`[SERVER] → QUESTION ${state.questionIndex + 1}/${state.totalQuestions}`)
  broadcastState()
}

function finishSocialVote(now: number): void {
  const question = state.questionPool[state.questionIndex]
  if (!question) return

  // Social point values (authoritative)
  const PTS_MOST_TRUSTED = 88
  const PTS_MATCH = 69
  const PTS_FRIENDZONED = 22
  const PTS_IGNORED = 11

  const questionEndedAt = now - SOCIAL_VOTE_DURATION_MS
  const questionStartedAt = questionEndedAt - QUESTION_DURATION_MS

  // 1) Speed points for correct answers
  for (const player of Object.values(state.players)) {
    if (player.answer === question.correctAnswer && player.answerAt !== null) {
      const remainingMs = Math.max(0, questionStartedAt + QUESTION_DURATION_MS - player.answerAt)
      const remainingSec = remainingMs / 1000
      const pts = remainingSec >= 10 ? 100 : remainingSec >= 5 ? 75 : 50
      player.score += pts
      player.result = 'correct'
    } else if (player.answer === null) {
      player.result = 'timeUp'
    } else {
      player.result = 'wrong'
    }
  }

  const votes = new Map<string, number>()
  const whoVotedFor = new Map<string, string>()
  const playerIds = Object.keys(state.players)
  const isSolo = playerIds.length <= 1
  const socialLinks: SocialLinkPayload[] = []

  for (const [playerId, player] of Object.entries(state.players)) {
    if (player.socialVoteTarget && player.socialVoteTarget !== playerId) {
      whoVotedFor.set(playerId, player.socialVoteTarget)
      votes.set(player.socialVoteTarget, (votes.get(player.socialVoteTarget) ?? 0) + 1)
    }
  }

  // 2) Most Trusted — all players tied for max votes get the bonus
  let mostVotes = 0
  for (const count of votes.values()) {
    if (count > mostVotes) mostVotes = count
  }
  const mostTrustedIds: string[] = []
  if (mostVotes > 0) {
    for (const [id, count] of votes.entries()) {
      if (count === mostVotes) mostTrustedIds.push(id)
    }
  }
  for (const id of mostTrustedIds) {
    if (state.players[id]) {
      state.players[id].score += PTS_MOST_TRUSTED
    }
  }

  // UI primary: highest votes, then highest score, then displayName (stable)
  let mostTrustedId: string | null = null
  if (mostTrustedIds.length > 0) {
    mostTrustedIds.sort((a, b) => {
      const sa = state.players[a]?.score ?? 0
      const sb = state.players[b]?.score ?? 0
      if (sb !== sa) return sb - sa
      const na = state.players[a]?.displayName || a
      const nb = state.players[b]?.displayName || b
      return na.localeCompare(nb)
    })
    mostTrustedId = mostTrustedIds[0]
  }

  // 3) Match / Friendzoned / Ignored (disabled in solo)
  // Rules (exclusive, no double-count confusion):
  // - MATCH (mutual vote): +69 each side of the pair, once per pair
  // - FRIENDZONED: you voted for someone who did not vote for you → -22
  // - IGNORED: you received 0 votes AND you did not vote for anyone → -11
  //   (if you voted but got 0 votes, only FRIENDZONED applies — not both)
  if (!isSolo) {
    const matchedPairs = new Set<string>()

    for (const [playerId, player] of Object.entries(state.players)) {
      const myTarget = whoVotedFor.get(playerId)
      const votesReceived = votes.get(playerId) ?? 0
      const sourceName = player.displayName || playerId.slice(0, 10)

      if (myTarget) {
        const targetName = state.players[myTarget]?.displayName || myTarget.slice(0, 10)
        const theirTarget = whoVotedFor.get(myTarget)

        if (theirTarget === playerId) {
          // Mutual match
          const pairKey = [playerId, myTarget].sort().join('|')
          if (!matchedPairs.has(pairKey)) {
            matchedPairs.add(pairKey)
            player.score += PTS_MATCH
            if (state.players[myTarget]) state.players[myTarget].score += PTS_MATCH
            socialLinks.push({
              sourceId: playerId,
              targetId: myTarget,
              sourceName,
              targetName,
              kind: 'MATCH'
            })
          }
        } else {
          // You voted, they did not vote for you → Friendzoned only
          player.score += PTS_FRIENDZONED
          socialLinks.push({
            sourceId: playerId,
            targetId: myTarget,
            sourceName,
            targetName,
            kind: 'FRIENDZONED'
          })
        }
      } else if (votesReceived === 0) {
        // No outgoing vote + nobody voted for you → Ignored only
        player.score += PTS_IGNORED
        const other = playerIds.find((id) => id !== playerId)
        if (other) {
          socialLinks.push({
            sourceId: playerId,
            targetId: other,
            sourceName,
            targetName: state.players[other]?.displayName || other.slice(0, 10),
            kind: 'IGNORED'
          })
        }
      }
    }
  }

  lastSocialLinks = socialLinks

  if (mostTrustedId && state.players[mostTrustedId]) {
    const name = state.players[mostTrustedId].displayName || mostTrustedId.slice(0, 8)
    const tieNote = mostTrustedIds.length > 1 ? ` (tie x${mostTrustedIds.length})` : ''
    state.socialSummary = JSON.stringify({
      trusted: name,
      votes: mostVotes,
      tie: mostTrustedIds.length > 1
    })
    console.log(`[SERVER] Most Trusted: ${name} with ${mostVotes} votes${tieNote} (+${PTS_MOST_TRUSTED} each tied)`)
  } else {
    state.socialSummary = 'No social votes'
  }

  state.phase = 'REVEAL'
  state.phaseStartedAt = now
  state.phaseDeadline = now + REVEAL_DURATION_MS + SCORE_DURATION_MS
  broadcastState()
}

function advanceQuestion(now: number): void {
  state.questionIndex += 1
  if (state.questionIndex >= state.questionPool.length) {
    state.phase = 'GAME_OVER'
    state.phaseStartedAt = now
    state.phaseDeadline = 0
    console.log('[SERVER] → GAME_OVER')
    broadcastState()
    return
  }
  startQuestion(now)
}

function resetGame(): void {
  const now = Date.now()
  state.questionIndex = 0
  state.totalQuestions = 0
  state.phase = 'LOBBY'
  state.phaseStartedAt = now
  state.phaseDeadline = 0
  state.socialSummary = null
  state.questionPool = []
  questionIdCounter = 0

  for (const player of Object.values(state.players)) {
    player.score = 0
    player.answer = null
    player.answerAt = null
    player.result = null
    player.socialVoteTarget = null
    player.questionsSubmitted = 0
  }

  console.log('[SERVER] Game reset → LOBBY')
}

// ─────────────────────────────────────────────────────────────
// Game loop
// ─────────────────────────────────────────────────────────────

function updateServer(now: number): void {
  if (state.phase === 'COLLECTING' && state.phaseDeadline > 0 && now >= state.phaseDeadline) {
    finishCollecting(now)
  } else if (state.phase === 'WAITING' && now >= state.phaseDeadline) {
    startQuestion(now)
  } else if (state.phase === 'QUESTION' && now >= state.phaseDeadline) {
    state.phase = 'SOCIAL_VOTE'
    state.phaseStartedAt = now
    state.phaseDeadline = now + SOCIAL_VOTE_DURATION_MS
    broadcastState()
  } else if (state.phase === 'SOCIAL_VOTE' && now >= state.phaseDeadline) {
    finishSocialVote(now)
  } else if (state.phase === 'REVEAL' && now >= state.phaseDeadline) {
    advanceQuestion(now)
  }

  if (now - lastBroadcastAt >= 1000) {
    broadcastState()
  }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function getOrCreatePlayer(playerId: string): PlayerState {
  if (!state.players[playerId]) {
    state.players[playerId] = {
      score: 0,
      answer: null,
      answerAt: null,
      result: null,
      socialVoteTarget: null,
      language: 'en',
      displayName: playerId.slice(0, 10),
      questionsSubmitted: 0
    }
  }
  return state.players[playerId]
}

function removePlayer(playerId: string, reason: string): void {
  if (!state.players[playerId]) return
  delete state.players[playerId]
  console.log(`[SERVER] Player removed (${reason}): ${playerId}`)
  broadcastState()
}

function broadcastState(): void {
  lastBroadcastAt = Date.now()
  const value = serializeState()
  void triviaRoom.send('state', { value })
}

function sendStateTo(playerId: string): void {
  void triviaRoom.send('state', { value: serializeState() }, { to: [playerId] })
}

function serializeState(): string {
  const question = state.questionPool[state.questionIndex] ?? null
  const isAnswerVisible = state.phase === 'REVEAL' || state.phase === 'GAME_OVER'

  const publicQuestion = question
    ? {
        ...question,
        correctAnswer: isAnswerVisible ? question.correctAnswer : 0
      }
    : null

  return JSON.stringify({
    phase: state.phase,
    questionIndex: state.questionIndex,
    totalQuestions: state.totalQuestions,
    phaseStartedAt: state.phaseStartedAt,
    phaseDeadline: state.phaseDeadline,
    socialSummary: state.socialSummary,
    socialLinks: state.phase === 'REVEAL' || state.phase === 'GAME_OVER' ? lastSocialLinks : [],
    players: state.players,
    question: publicQuestion,
    collectingSlotsLeft: Math.max(0, MAX_QUESTIONS - state.questionPool.length),
    collectingSecondsLeft:
      state.phase === 'COLLECTING' && state.phaseDeadline > 0
        ? Math.max(0, Math.ceil((state.phaseDeadline - Date.now()) / 1000))
        : 0
  })
}
