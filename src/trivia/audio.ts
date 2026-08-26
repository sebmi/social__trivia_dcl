import { AudioSource, engine, Entity, Transform } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
import { GamePhase } from './game'

const TICK_CLIP = 'assets/sounds/tictac.ogg'

// Question = normal, Social vote = faster/higher, Collecting = inverse (slower/lower)
const QUESTION_PITCH = 1
const SOCIAL_VOTE_PITCH = 1.3
const COLLECTING_PITCH = 0.77 // inverse feel of social vote
const RESULT_CLIP = 'assets/sounds/result.ogg'
const SFX_VOLUME = 0.7
const VICTORY_CLIP = 'assets/sounds/victory.ogg'

let tickEntity: Entity | null = null
let muted = false
let appliedPlaying = false
let appliedPitch = QUESTION_PITCH
let resultEntity: Entity | null = null
let lastPhase: GamePhase | null = null
let victoryEntity: Entity | null = null

function getTickEntity(): Entity {
  if (tickEntity === null) {
    tickEntity = engine.addEntity()
    Transform.create(tickEntity, { position: Vector3.create(8, 1, 8) })
    AudioSource.create(tickEntity, {
      audioClipUrl: TICK_CLIP,
      loop: true,
      playing: false,
      global: true,
      volume: 1,
      pitch: QUESTION_PITCH
    })
  }
  return tickEntity
}

function getResultEntity(): Entity {
  if (resultEntity === null) {
    resultEntity = engine.addEntity()

    Transform.create(resultEntity, {
      position: Vector3.create(8, 1, 8)
    })

    AudioSource.create(resultEntity, {
      audioClipUrl: RESULT_CLIP,
      loop: false,
      playing: false,
      global: true,
      volume: SFX_VOLUME
    })
  }

  return resultEntity
}

function getVictoryEntity(): Entity {
  if (victoryEntity === null) {
    victoryEntity = engine.addEntity()

    Transform.create(victoryEntity, {
      position: Vector3.create(8, 1, 8)
    })

    AudioSource.create(victoryEntity, {
      audioClipUrl: VICTORY_CLIP,
      loop: false,
      playing: false,
      global: true,
      volume: SFX_VOLUME
    })
  }

  return victoryEntity
}

export function updateTriviaAudio(
  phase: GamePhase,
  remainingSeconds?: number
): void {
  // ────────────────────────────────────────
  // 1. GÈRE LES SONS PONCTUELS (REVEAL/GAME_OVER)
  // ────────────────────────────────────────
  if (phase !== lastPhase) {
    if (phase === 'REVEAL' && !muted) {
      const source = AudioSource.getMutable(getResultEntity())
      source.playing = false  // Reset pour re-jouer
      source.playing = true
    } else if (phase === 'GAME_OVER' && !muted) {
      const source = AudioSource.getMutable(getVictoryEntity())
      source.playing = false
      source.playing = true
    }
    lastPhase = phase
  }

  // ────────────────────────────────────────
  // 2. GÈRE LE TIC-TAC (QUESTION/SOCIAL_VOTE/COLLECTING)
  // ────────────────────────────────────────
  const shouldPlay = !muted && (phase === 'QUESTION' || phase === 'SOCIAL_VOTE' || phase === 'COLLECTING')
  let pitch = QUESTION_PITCH

  if (phase === 'SOCIAL_VOTE') {
    pitch = SOCIAL_VOTE_PITCH
  } else if (phase === 'COLLECTING') {
    pitch = remainingSeconds !== undefined && remainingSeconds <= 10
      ? QUESTION_PITCH
      : COLLECTING_PITCH
  }

  if (shouldPlay === appliedPlaying && (!shouldPlay || pitch === appliedPitch)) return

  const source = AudioSource.getMutable(getTickEntity())
  source.pitch = pitch
  source.playing = shouldPlay
  appliedPlaying = shouldPlay
  appliedPitch = pitch
}

export function isAudioMuted(): boolean {
  return muted
}

export function toggleAudioMute(): void {
  muted = !muted
  // Force re-apply on next updateTriviaAudio call
  appliedPlaying = !appliedPlaying
}
