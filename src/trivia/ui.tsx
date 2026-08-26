import ReactEcs, { Input, Label, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { GameViewState, TriviaController } from './game'
import { isAudioMuted, toggleAudioMute } from './audio'
import { isPlayerInArena } from './platforms'
import { centeredLeft, hudLeft, hudTopOffset, isMobileLayout } from './layout'
import {
  getLanguageName,
  getLocalizedText,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  translate
} from './localization'

let game: TriviaController | null = null

let formQuestion = ''
let formAnswerA = ''
let formAnswerB = ''
let formAnswerC = ''
let formCorrect: 0 | 1 | 2 = 0
let formFeedback: string | null = null
let formFeedbackUntil = 0
let rulesOpen = false
let openRulesAfterLanguage = false
let forceLanguageUI = false

type ConfettiBit = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  spin: number
  color: Color4
  born: number
  life: number
}

let confettiBits: ConfettiBit[] = []
let confettiStartedForGameOver = false

const CONFETTI_COLORS = [
  Color4.create(1, 0.3, 0.4, 1),
  Color4.create(1, 0.75, 0.2, 1),
  Color4.create(0.3, 0.9, 0.5, 1),
  Color4.create(0.3, 0.7, 1, 1),
  Color4.create(0.85, 0.4, 1, 1),
  Color4.create(1, 1, 1, 1)
]

function spawnConfetti(): void {
  const now = Date.now()
  confettiBits = []
  for (let i = 0; i < 22; i++) {
    const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.4
    const speed = 180 + Math.random() * 220
    confettiBits.push({
      x: 960,
      y: 540,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 10 + Math.random() * 16,
      rotation: Math.random() * 360,
      spin: (Math.random() - 0.5) * 240,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      born: now,
      life: 2200 + Math.random() * 1200
    })
  }
}

function updateConfetti(now: number): void {
  const dt = 1 / 30
  for (const bit of confettiBits) {
    bit.x += bit.vx * dt
    bit.y += bit.vy * dt
    bit.vy += 120 * dt // légère gravité
    bit.vx *= 0.99
    bit.rotation += bit.spin * dt
  }
  confettiBits = confettiBits.filter((bit) => now - bit.born < bit.life)
}

const COLORS = {
  background: Color4.create(0.015, 0.025, 0.055, 1),
  panel: Color4.create(0.025, 0.08, 0.13, 1),
  cyan: Color4.create(0.12, 0.88, 1, 1),
  blue: Color4.create(0.04, 0.38, 0.62, 1),
  green: Color4.create(0.1, 0.82, 0.4, 1),
  red: Color4.create(1, 0.2, 0.25, 1),
  gold: Color4.create(1, 0.78, 0.16, 1),
  white: Color4.White(),
  dark: Color4.create(0.02, 0.05, 0.09, 1)
}

const AVATAR_FACE_UVS = [0.18, 0.14, 0.18, 0.86, 0.82, 0.86, 0.82, 0.14]

export function setTriviaGame(triviaGame: TriviaController): void {
  game = triviaGame
}

export const TriviaUI = () => {
  if (!game) return null
  const state = game.getViewState()

  const showLanguage =
    state.phase === 'LANGUAGE_SELECTION' &&
    (isPlayerInArena() || forceLanguageUI)

    // Reset confettis dès qu'on n'est plus en fin de partie
  if (state.phase !== 'GAME_OVER') {
    confettiStartedForGameOver = false
    if (confettiBits.length > 0) confettiBits = []
  }

  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
      {state.phase === 'LANGUAGE_SELECTION' ? (
        showLanguage ? <LanguageSelection /> : <EnterArenaHint />
      ) : state.phase === 'LOBBY' ? (
        <LobbyPanel state={state} />
      ) : state.phase === 'COLLECTING' ? (
        <CollectingPanel state={state} />
      ) : (
        <GameHud state={state} />
      )}

      <RulesButton phase={state.phase} />
      <RulesPanel />
    </UiEntity>
  )
}

const EnterArenaHint = () => (
  <UiEntity
    uiTransform={{
      width: 700,
      height: 90,
      positionType: 'absolute',
      position: {
        bottom: isMobileLayout() ? 26 : 48,
        left: isMobileLayout() ? centeredLeft(700) - 50 : centeredLeft(700)
      },
      alignItems: 'center',
      justifyContent: 'center',
      padding: { left: 20, right: 20 },
      borderRadius: 10
    }}
    uiBackground={{ color: COLORS.panel }}
    uiText={{ value: translate('getReady'), fontSize: 30, color: COLORS.cyan, textAlign: 'middle-center' }}
  />
)

const ScreenBackdrop = () => (
  <UiEntity
    uiTransform={{
      width: '300%',
      height: '300%',
      positionType: 'absolute',
      position: { top: '-100%', left: '-100%' }
    }}
    uiBackground={{ color: COLORS.background }}
  />
)

const LanguageSelection = () => {
  const left = SUPPORTED_LANGUAGES.slice(0, 4)
  const right = SUPPORTED_LANGUAGES.slice(4)
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'absolute',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <ScreenBackdrop />
      <UiEntity
        uiTransform={{ width: 900, height: 100, alignItems: 'center', justifyContent: 'center' }}
        uiText={{ value: 'SOCIAL TRIVIA', fontSize: 64, color: COLORS.cyan, textAlign: 'middle-center' }}
      />
      <UiEntity
        uiTransform={{ width: 900, height: 60, margin: { bottom: 28 }, alignItems: 'center', justifyContent: 'center' }}
        uiText={{ value: translate('chooseLanguage'), fontSize: 28, color: COLORS.white, textAlign: 'middle-center' }}
      />
      <UiEntity uiTransform={{ width: 920, height: 380, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start' }}>
        <UiEntity uiTransform={{ width: 440, height: 380, flexDirection: 'column', alignItems: 'center', margin: { right: 20 } }}>
          {left.map((language) => (
            <LanguageButton language={language} />
          ))}
        </UiEntity>
        <UiEntity uiTransform={{ width: 440, height: 380, flexDirection: 'column', alignItems: 'center' }}>
          {right.map((language) => (
            <LanguageButton language={language} />
          ))}
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

const LanguageButton = ({ language }: { language: SupportedLanguage }) => (
  <UiEntity
    uiTransform={{
      width: 400,
      height: 72,
      margin: { bottom: 16 },
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10
    }}
    uiBackground={{ color: COLORS.blue }}
    onMouseDown={() => {
      game?.selectLanguage(language)
      forceLanguageUI = false
      if (openRulesAfterLanguage) {
        openRulesAfterLanguage = false
        rulesOpen = true
      }
    }}
  >
    <Label value={getLanguageName(language)} fontSize={26} color={COLORS.white} textAlign="middle-center" />
  </UiEntity>
)

const LobbyPanel = ({ state }: { state: GameViewState }) => (
  <UiEntity
    uiTransform={{
      width: '100%',
      height: '100%',
      positionType: 'absolute',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <ScreenBackdrop />
    <UiEntity
      uiTransform={{ width: 900, height: 70, alignItems: 'center', justifyContent: 'center' }}
      uiText={{ value: translate('lobbyTitle'), fontSize: 48, color: COLORS.cyan, textAlign: 'middle-center' }}
    />
    <UiEntity
      uiTransform={{ width: 900, height: 70, margin: { bottom: 20 }, alignItems: 'center', justifyContent: 'center' }}
      uiText={{
        value: translate('lobbyHint'),
        fontSize: 22,
        color: COLORS.white,
        textAlign: 'middle-center'
      }}
    />
    <UiEntity
      uiTransform={{
        width: 700,
        height: 280,
        flexDirection: 'column',
        alignItems: 'center',
        padding: { top: 16, bottom: 16, left: 20, right: 20 },
        borderRadius: 12,
        margin: { bottom: 24 }
      }}
      uiBackground={{ color: COLORS.panel }}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: 40, margin: { bottom: 10 }, alignItems: 'center', justifyContent: 'center' }}
        uiText={{
          value: `${translate('lobbyPlayers')}: ${state.players.length || 1}`,
          fontSize: 24,
          color: COLORS.cyan,
          textAlign: 'middle-center'
        }}
      />
      {state.players.length === 0 ? (
        <UiEntity
          uiTransform={{ width: '100%', height: 40, alignItems: 'center', justifyContent: 'center' }}
          uiText={{ value: translate('waitingPlayers'), fontSize: 20, color: COLORS.white, textAlign: 'middle-center' }}
        />
      ) : (
        state.players.map((player) => (
          <UiEntity
            key={player.playerId}
            uiTransform={{ width: '100%', height: 36, alignItems: 'center', justifyContent: 'center' }}
            uiText={{
              value: player.isSelf ? `• ${player.displayName} (you)` : `• ${player.displayName}`,
              fontSize: 22,
              color: player.isSelf ? COLORS.cyan : COLORS.white,
              textAlign: 'middle-center'
            }}
          />
        ))
      )}
    </UiEntity>
    <UiEntity
      uiTransform={{
        width: 420,
        height: 76,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10
      }}
      uiBackground={{ color: COLORS.blue }}
      uiText={{ value: translate('startGame'), fontSize: 28, color: COLORS.white, textAlign: 'middle-center' }}
      onMouseDown={() => game?.startGame()}
    />
        <UiEntity
      uiTransform={{
        width: 420,
        height: 64,
        margin: { top: 14 },
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10
      }}
      uiBackground={{ color: COLORS.red }}
      uiText={{
        value: translate('leaveLobby'),
        fontSize: 26,
        color: COLORS.white,
        textAlign: 'middle-center'
      }}
      onMouseDown={() => game?.leaveLobby()}
    />

    <MuteButton />

  </UiEntity>
)

const CollectingPanel = ({ state }: { state: GameViewState }) => {
  const feedbackVisible = formFeedback && Date.now() < formFeedbackUntil
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'absolute',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <ScreenBackdrop />
      <UiEntity
        uiTransform={{ width: 900, height: 56, alignItems: 'center', justifyContent: 'center' }}
        uiText={{ value: translate('collectingTitle'), fontSize: 34, color: COLORS.cyan, textAlign: 'middle-center' }}
      />
      <UiEntity
        uiTransform={{
          width: 900,
          height: 40,
          margin: { bottom: 12 },
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <UiEntity
          uiTransform={{ width: 420, height: 40, alignItems: 'center' }}
          uiText={{
            value: `${translate('remainingSlots')}: ${state.collectingSlotsLeft}`,
            fontSize: 22,
            color: COLORS.white,
            textAlign: 'middle-left'
          }}
        />
        <UiEntity
          uiTransform={{ width: 420, height: 40, alignItems: 'center' }}
          uiText={{
            value: `${translate('remainingTime')}: ${state.collectingSecondsLeft}s`,
            fontSize: 22,
            color: state.collectingSecondsLeft <= 10 ? COLORS.red : COLORS.white,
            textAlign: 'middle-right'
          }}
        />
      </UiEntity>
      <UiEntity
        uiTransform={{
          width: 920,
          height: 500,
          flexDirection: 'column',
          alignItems: 'center',
          padding: { left: 30, right: 30, top: 20, bottom: 20 },
          borderRadius: 14
        }}
        uiBackground={{ color: COLORS.panel }}
      >
        <Input
          uiTransform={{ width: '100%', height: 52, margin: { bottom: 14 } }}
          uiBackground={{ color: COLORS.dark }}
          fontSize={20}
          color={COLORS.white}
          placeholder={translate('questionPlaceholder')}
          placeholderColor={Color4.create(0.5, 0.5, 0.55, 1)}
          value={formQuestion}
          onChange={(value) => {
            formQuestion = value
          }}
        />
        <AnswerInput label="A" placeholder={translate('answerAPlaceholder')} value={formAnswerA} onChange={(v) => (formAnswerA = v)} isSelected={formCorrect === 0} onSelect={() => (formCorrect = 0)} />
        <AnswerInput label="B" placeholder={translate('answerBPlaceholder')} value={formAnswerB} onChange={(v) => (formAnswerB = v)} isSelected={formCorrect === 1} onSelect={() => (formCorrect = 1)} />
        <AnswerInput label="C" placeholder={translate('answerCPlaceholder')} value={formAnswerC} onChange={(v) => (formAnswerC = v)} isSelected={formCorrect === 2} onSelect={() => (formCorrect = 2)} />
        <UiEntity
          uiTransform={{ width: '100%', height: 28, margin: { top: 6, bottom: 10 } }}
          uiText={{
            value: `${translate('correctAnswerLabel')} ${String.fromCharCode(65 + formCorrect)}`,
            fontSize: 18,
            color: COLORS.green,
            textAlign: 'middle-center'
          }}
        />
        <UiEntity
          uiTransform={{ width: 360, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
          uiBackground={{ color: state.collectingSlotsLeft > 0 ? COLORS.blue : Color4.create(0.3, 0.3, 0.35, 1) }}
          uiText={{ value: translate('submitQuestion'), fontSize: 24, color: COLORS.white, textAlign: 'middle-center' }}
          onMouseDown={() => {
            if (!game || state.collectingSlotsLeft <= 0) return
            const q = formQuestion.trim()
            const a = formAnswerA.trim()
            const b = formAnswerB.trim()
            const c = formAnswerC.trim()
            if (q.length < 8 || a.length < 1 || b.length < 1 || c.length < 1) {
              formFeedback = 'Question ou réponses trop courtes'
              formFeedbackUntil = Date.now() + 2500
              return
            }
            game.submitQuestion(q, a, b, c, formCorrect)
            formFeedback = translate('questionSubmitted')
            formFeedbackUntil = Date.now() + 2000
            formQuestion = ''
            formAnswerA = ''
            formAnswerB = ''
            formAnswerC = ''
            formCorrect = 0
          }}
        />
        {feedbackVisible && (
          <UiEntity
            uiTransform={{ width: '100%', height: 32, margin: { top: 10 } }}
            uiText={{ value: formFeedback || '', fontSize: 20, color: COLORS.green, textAlign: 'middle-center' }}
          />
        )}
      </UiEntity>
      <UiEntity
        uiTransform={{ width: 900, height: 36, margin: { top: 12 } }}
        uiText={{
          value: `You submitted: ${state.questionsSubmittedByMe}`,
          fontSize: 20,
          color: COLORS.cyan,
          textAlign: 'middle-center'
        }}
      />
      <MuteButton />

    </UiEntity>
  )
}

const AnswerInput = ({
  label,
  placeholder,
  value,
  onChange,
  isSelected,
  onSelect
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  isSelected: boolean
  onSelect: () => void
}) => (
  <UiEntity uiTransform={{ width: '100%', height: 52, margin: { bottom: 10 }, flexDirection: 'row', alignItems: 'center' }}>
    <UiEntity
      uiTransform={{ width: 52, height: 52, margin: { right: 12 }, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
      uiBackground={{ color: isSelected ? COLORS.green : COLORS.blue }}
      uiText={{ value: label, fontSize: 24, color: COLORS.white, textAlign: 'middle-center' }}
      onMouseDown={onSelect}
    />
    <Input
      uiTransform={{ width: 760, height: 52 }}
      uiBackground={{ color: COLORS.dark }}
      fontSize={20}
      color={COLORS.white}
      placeholder={placeholder}
      placeholderColor={Color4.create(0.5, 0.5, 0.55, 1)}
      value={value}
      onChange={onChange}
    />
  </UiEntity>
)

function isSocialVoteFocused(state: GameViewState): boolean {
  return state.phase === 'SOCIAL_VOTE' && state.players.some((p) => !p.isSelf)
}

const GameHud = ({ state }: { state: GameViewState }) => (
  <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
    <QuestionPanel state={state} />
    <AnswerStrip state={state} />
    {state.phase === 'SOCIAL_VOTE' && <SocialVotePanel state={state} />}
    {state.phase === 'REVEAL' && <SocialLinksPanel state={state} />}
    <ScorePanel state={state} />
    <MuteButton />

    <CenterMessage state={state} />
    {state.phase === 'GAME_OVER' && <GameOver state={state} />}
  </UiEntity>
)

const RulesButton = ({ phase }: { phase: string }) => (
  <UiEntity
    uiTransform={{
      width: 76,
      height: 76,
      positionType: 'absolute',
      position: {
        right: isMobileLayout() ? 10 : 130,
        top: isMobileLayout() ? 188 : 140
      },
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10
    }}
    uiBackground={{ color: COLORS.blue }}
    uiText={{
      value: translate('rulesButton'),
      fontSize: 38,
      color: COLORS.white,
      textAlign: 'middle-center'
    }}
onMouseDown={() => {
  if (phase === 'LANGUAGE_SELECTION') {
    // Hors plateforme ou pas encore de langue :
    // on force l'écran langue, puis les règles après le choix
    openRulesAfterLanguage = true
    forceLanguageUI = true
    rulesOpen = false
    return
  }
  rulesOpen = !rulesOpen
}}
  />
)

const MuteButton = () => {
  const muted = isAudioMuted()
  const fontSize = isMobileLayout() ? (muted ? 34 : 46) : muted ? 26 : 34
  return (
    <UiEntity
      uiTransform={{
        width: 76,
        height: 76,
        positionType: 'absolute',
        position: { right: isMobileLayout() ? 10 : 40, top: isMobileLayout() ? 116 : 140 },
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10
      }}
      uiBackground={{ color: muted ? Color4.create(0.18, 0.28, 0.36, 1) : COLORS.gold }}
      uiText={{ value: muted ? '♪ ✕' : '♪', fontSize, color: muted ? COLORS.white : Color4.Black(), textAlign: 'middle-center' }}
      onMouseDown={() => toggleAudioMute()}
    />
  )
}

const SocialVotePanel = ({ state }: { state: GameViewState }) => {
  const candidates = state.players.filter((player) => !player.isSelf)
  if (candidates.length === 0) return null
  return (
    <UiEntity
      uiTransform={{
        width: 1120,
        height: 340,
        positionType: 'absolute',
        position: { top: 36 + hudTopOffset(), left: hudLeft(1120) },
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <UiEntity
        uiTransform={{ width: 760, height: 82, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
        uiBackground={{ color: COLORS.panel }}
      >
        <UiEntity
          uiTransform={{ width: '100%', height: 42, alignItems: 'center', justifyContent: 'center' }}
          uiText={{ value: 'Who do you trust?', fontSize: 30, color: COLORS.cyan, textAlign: 'middle-center' }}
        />
        <UiEntity
          uiTransform={{ width: '100%', height: 30, alignItems: 'center', justifyContent: 'center' }}
          uiText={{
            value: `${state.remainingSeconds}s`,
            fontSize: 38,
            color: state.remainingSeconds <= 3 ? COLORS.red : COLORS.white,
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: 250, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' }}>
        {candidates.map((player) => (
          <UiEntity
            key={player.playerId}
            uiTransform={{ width: 230, height: 240, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <UiEntity
              uiTransform={{ width: '100%', height: 34, alignItems: 'center', justifyContent: 'center' }}
              uiText={{ value: player.displayName, fontSize: 22, color: COLORS.white, textAlign: 'middle-center' }}
            />
            <SocialVoteAvatar
              playerId={player.playerId}
              displayName={player.displayName}
              selected={player.playerId === state.socialVoteTarget}
              onSelect={() => game?.selectSocialVote(player.playerId)}
            />
          </UiEntity>
        ))}
      </UiEntity>
    </UiEntity>
  )
}

const SocialVoteAvatar = ({
  playerId,
  displayName,
  selected,
  onSelect
}: {
  playerId: string
  displayName: string
  selected: boolean
  onSelect: () => void
}) => {
  const isGuest = playerId.startsWith('guest-')
  const frameColor = selected ? COLORS.cyan : Color4.create(0.18, 0.28, 0.36, 1)
  const mobile = isMobileLayout()
  return (
    <UiEntity
      uiTransform={{ width: 190, height: 190, borderRadius: 95, padding: selected ? 7 : 5 }}
      uiBackground={{ color: frameColor }}
      onMouseDown={onSelect}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: '100%', borderRadius: 90, alignItems: 'center', justifyContent: 'center' }}
        uiBackground={{ color: COLORS.blue }}
      >
        {/* Guests / mobile fallback: initials. PC + real user: portrait only (no initials overlay). */}
        {(isGuest || mobile) && (
          <UiEntity
            uiTransform={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            uiText={{
              value: (displayName || 'P').slice(0, 2).toUpperCase(),
              fontSize: 34,
              color: COLORS.white,
              textAlign: 'middle-center'
            }}
          />
        )}
        {!isGuest && (
          <UiEntity
            uiTransform={{ width: '100%', height: '100%', positionType: 'absolute', borderRadius: 90 }}
            uiBackground={{
              avatarTexture: { userId: playerId },
              textureMode: 'stretch',
              uvs: AVATAR_FACE_UVS,
              color: COLORS.white
            }}
          />
        )}
      </UiEntity>
    </UiEntity>
  )
}

const QuestionPanel = ({ state }: { state: GameViewState }) => {
  if (!state.question || state.phase === 'WAITING' || state.phase === 'GAME_OVER' || state.phase === 'REVEAL') return null
  if (isSocialVoteFocused(state)) return null
  return (
    <UiEntity
      uiTransform={{
        width: 1120,
        height: 180,
        positionType: 'absolute',
        position: { top: 36 + hudTopOffset(), left: hudLeft(1120) },
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        padding: { left: 34, right: 34, top: 15, bottom: 15 }
      }}
      uiBackground={{ color: COLORS.panel }}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: 44, alignItems: 'center', justifyContent: 'center' }}
        uiText={{ value: `${state.questionNumber} / ${state.totalQuestions}`, fontSize: 26, color: COLORS.cyan, textAlign: 'middle-center' }}
      />
      <UiEntity
        uiTransform={{ width: '100%', height: 106, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
        uiText={{ value: getLocalizedText(state.question.question), fontSize: 32, color: COLORS.white, textAlign: 'middle-center' }}
      />
    </UiEntity>
  )
}

const AnswerStrip = ({ state }: { state: GameViewState }) => {
  if (!state.question || state.phase === 'WAITING' || state.phase === 'GAME_OVER') return null
  if (isSocialVoteFocused(state)) return null
  return (
    <UiEntity
      uiTransform={{
        width: 1120,
        height: 86,
        positionType: 'absolute',
        position: { top: 232 + hudTopOffset(), left: hudLeft(1120) },
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderRadius: 10
      }}
    >
      {state.question.answers.map((answer, index) => (
        <UiEntity
          key={index}
          uiTransform={{ width: 356, height: 86, alignItems: 'center', justifyContent: 'center', borderRadius: 10, padding: { left: 15, right: 15 } }}
          uiBackground={{ color: getAnswerColor(state, index) }}
          uiText={{
            value: `${String.fromCharCode(65 + index)}   ${getLocalizedText(answer)}`,
            fontSize: 23,
            color: COLORS.white,
            textAlign: 'middle-center'
          }}
          onMouseDown={() => {
            if (state.phase === 'QUESTION') game?.selectAnswer(index as 0 | 1 | 2)
          }}
        />
      ))}
    </UiEntity>
  )
}

function getAnswerColor(state: GameViewState, answerIndex: number): Color4 {
  const isReveal = state.phase === 'REVEAL' || state.phase === 'SCORE'
  if (isReveal && answerIndex === state.question?.correctAnswer) return COLORS.green
  if (isReveal && answerIndex === state.selectedAnswer) return COLORS.red
  if (answerIndex === state.selectedAnswer) return COLORS.blue
  return COLORS.panel
}

const ScorePanel = ({ state }: { state: GameViewState }) => {
  const mobile = isMobileLayout()
  const width = mobile ? 210 : 250
  const height = mobile ? 62 : 90
  return (
    <UiEntity
      uiTransform={{
        width,
        height,
        positionType: 'absolute',
        position: mobile ? { top: 32, left: hudLeft(width) } : { top: 36, right: 40 },
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10
      }}
      uiBackground={{ color: COLORS.panel }}
      uiText={{ value: `${translate('score')}  ${state.score}`, fontSize: mobile ? 24 : 27, color: COLORS.white, textAlign: 'middle-center' }}
    />
  )
}

const CenterMessage = ({ state }: { state: GameViewState }) => {
  let message = ''
  if (state.phase === 'WAITING') message = translate('getReady')
  else if (state.phase === 'QUESTION') {
    message =
      state.selectedAnswer === null
        ? `${state.remainingSeconds}`
        : `${state.remainingSeconds}   ${translate('selected')}: ${String.fromCharCode(65 + state.selectedAnswer)}`
  } else if (state.phase === 'LOCKED') message = translate('timeUp')
  else if (state.phase === 'REVEAL' || state.phase === 'SCORE') {
    if (state.result === 'correct') message = translate('correct')
    else if (state.result === 'wrong') message = translate('wrong')
    else message = translate('timeUp')
    if (state.phase === 'SCORE') message += '  ' + translate('nextQuestion')
  }
  if (!message) return null
  const urgent = state.phase === 'QUESTION' && state.remainingSeconds <= 3
  const positive = state.result === 'correct'
  return (
    <UiEntity
      uiTransform={{
        width: 600,
        height: 94,
        positionType: 'absolute',
        position: { bottom: isMobileLayout() ? 26 : 48, left: hudLeft(600) },
        alignItems: 'center',
        justifyContent: 'center',
        padding: { left: 20, right: 20 },
        borderRadius: 10
      }}
      uiBackground={{ color: COLORS.panel }}
      uiText={{
        value: message,
        fontSize: state.phase === 'QUESTION' ? 38 : 29,
        color: urgent || state.result === 'wrong' || state.result === 'timeUp' ? COLORS.red : positive ? COLORS.green : COLORS.cyan,
        textAlign: 'middle-center'
      }}
    />
  )
}


function getRevealHighlights(state: GameViewState) {
  const trusted = new Map<string, number>()
  const friendzoned = new Map<string, number>()
  const ignored = new Map<string, number>()

  for (const player of state.players) {
    trusted.set(player.playerId, 0)
    friendzoned.set(player.playerId, 0)
    ignored.set(player.playerId, 0)
  }

  for (const link of state.socialLinks) {
    if (link.kind === 'MATCH') {
      trusted.set(link.sourceId, (trusted.get(link.sourceId) ?? 0) + 1)
      trusted.set(link.targetId, (trusted.get(link.targetId) ?? 0) + 1)
    } else if (link.kind === 'FRIENDZONED') {
      friendzoned.set(link.sourceId, (friendzoned.get(link.sourceId) ?? 0) + 1)
    } else {
      ignored.set(link.sourceId, (ignored.get(link.sourceId) ?? 0) + 1)
      ignored.set(link.targetId, (ignored.get(link.targetId) ?? 0) + 1)
    }
  }

  const top = (scores: Map<string, number>) => {
    let winner: GameViewState['players'][number] | null = null
    let value = 0
    for (const player of state.players) {
      const score = scores.get(player.playerId) ?? 0
      if (score > value) {
        value = score
        winner = player
      }
    }
    return winner
  }

  return {
    trusted: top(trusted),
    friendzoned: top(friendzoned),
    ignored: top(ignored)
  }
}

const RevealAvatar = ({
  playerId,
  displayName
}: {
  playerId: string
  displayName: string
}) => {
  const isGuest = playerId.startsWith('guest-')
  return (
    <UiEntity
      uiTransform={{ width: 190, height: 190, borderRadius: 95, padding: 5 }}
      uiBackground={{ color: Color4.create(0.18, 0.28, 0.36, 1) }}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: '100%', borderRadius: 90, alignItems: 'center', justifyContent: 'center' }}
        uiBackground={{ color: COLORS.blue }}
      >
        {isGuest ? (
          <UiEntity
            uiTransform={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            uiText={{
              value: (displayName || 'P').slice(0, 2).toUpperCase(),
              fontSize: 34,
              color: COLORS.white,
              textAlign: 'middle-center'
            }}
          />
        ) : (
          <UiEntity
            uiTransform={{ width: '100%', height: '100%', positionType: 'absolute', borderRadius: 90 }}
            uiBackground={{
              avatarTexture: { userId: playerId },
              textureMode: 'stretch',
              uvs: AVATAR_FACE_UVS,
              color: COLORS.white
            }}
          />
        )}
      </UiEntity>
    </UiEntity>
  )
}

const RevealSlot = ({
  title,
  player,
  color,
  points
}: {
  title: string
  player: GameViewState['players'][number] | null
  color: Color4
  points?: string
}) => (
  <UiEntity
    uiTransform={{
      width: 240,
      height: points ? 260 : 240,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start'
    }}
  >
    <UiEntity
      uiTransform={{ width: '100%', height: 24, alignItems: 'center', justifyContent: 'center' }}
      uiText={{ value: title, fontSize: 18, color, textAlign: 'middle-center' }}
    />
    {player ? (
      <UiEntity
        uiTransform={{
          width: '100%',
          height: points ? 230 : 210,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <RevealAvatar playerId={player.playerId} displayName={player.displayName} />
        <UiEntity
          uiTransform={{ width: '100%', height: 24, margin: { top: 6 }, alignItems: 'center', justifyContent: 'center' }}
          uiText={{ value: player.displayName, fontSize: 18, color: COLORS.white, textAlign: 'middle-center' }}
        />
        {points && (
          <UiEntity
            uiTransform={{ width: '100%', height: 22, alignItems: 'center', justifyContent: 'center' }}
            uiText={{ value: points, fontSize: 18, color, textAlign: 'middle-center' }}
          />
        )}
      </UiEntity>
    ) : (
      <UiEntity
        uiTransform={{ width: '100%', height: 190, alignItems: 'center', justifyContent: 'center' }}
        uiText={{ value: '-', fontSize: 28, color: COLORS.white, textAlign: 'middle-center' }}
      />
    )}
  </UiEntity>
)

const SocialLinksPanel = ({ state }: { state: GameViewState }) => {
  const top = getRevealHighlights(state)
  const matches = state.socialLinks.filter((link) => link.kind === 'MATCH')
  const mobile = isMobileLayout()

  const matchBanner =
    matches.length === 0
      ? null
      : matches.length === 1
        ? `MATCH! ${matches[0].sourceName} <-> ${matches[0].targetName} (+69)`
        : `${matches.length} MATCHES`

  return (
    <UiEntity
      uiTransform={{
        width: 1120,
        height: mobile ? 380 : 520,
        positionType: 'absolute',
        position: mobile
          ? { top: 48 + hudTopOffset(), left: hudLeft(1120) }
          : { top: 36 + hudTopOffset(), left: centeredLeft(1120) },
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        borderRadius: 10,
        padding: { left: 20, right: 20, top: 14, bottom: 14 }
      }}
      uiBackground={{ color: COLORS.panel }}
    >
      {matchBanner && (
        <UiEntity
          uiTransform={{
            width: mobile ? 680 : 560,
            height: 42,
            margin: { bottom: mobile ? 14 : 16 },
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8
          }}
          uiBackground={{ color: COLORS.green }}
          uiText={{ value: matchBanner, fontSize: 24, color: Color4.Black(), textAlign: 'middle-center' }}
        />
      )}

      {mobile ? (
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 280,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-evenly'
          }}
        >
          <RevealSlot title="MOST TRUSTED" player={top.trusted} color={COLORS.green} points="+88"/>
          <RevealSlot title="FRIENDZONED" player={top.friendzoned} color={COLORS.cyan} points="+22" />
          <RevealSlot title="IGNORED" player={top.ignored} color={COLORS.white} points="+11" />
        </UiEntity>
      ) : (
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 450,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}
        >
          <RevealSlot title="MOST TRUSTED" player={top.trusted} color={COLORS.green} points="+88" />
          <UiEntity
            uiTransform={{
              width: 560,
              height: 270,
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-evenly',
              margin: { top: 12 }
            }}
          >
            <RevealSlot title="FRIENDZONED" player={top.friendzoned} color={COLORS.cyan} points="+22" />
            <RevealSlot title="IGNORED" player={top.ignored} color={COLORS.white} points="+11" />
          </UiEntity>
        </UiEntity>
      )}
    </UiEntity>
  )
}

const ConfettiLayer = () => {
  const now = Date.now()
  updateConfetti(now)

  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
      {confettiBits.map((bit, index) => {
        const age = (now - bit.born) / bit.life
        const fade = Math.max(0, 1 - age)
        // scale : part un peu grand, puis diminue + variation
        const scale = (0.7 + Math.sin(age * Math.PI) * 0.55) * fade
        const size = Math.max(4, bit.size * scale)
        const color = Color4.create(bit.color.r, bit.color.g, bit.color.b, fade)

        return (
          <UiEntity
            key={index}
            uiTransform={{
              width: size,
              height: size * (0.55 + (index % 3) * 0.2),
              positionType: 'absolute',
              position: {
                left: bit.x - size / 2,
                top: bit.y - size / 2
              }
            }}
            uiBackground={{ color }}
          />
        )
      })}
    </UiEntity>
  )
}

const GameOver = ({ state }: { state: GameViewState }) => {
  if (!confettiStartedForGameOver) {
    confettiStartedForGameOver = true
    spawnConfetti()
  }

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'absolute',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10
      }}
    >
      <ScreenBackdrop />
      <ConfettiLayer />

      <UiEntity
        uiTransform={{ width: 700, height: 100, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
        uiText={{ value: translate('gameOver'), fontSize: 52, color: COLORS.cyan, textAlign: 'middle-center' }}
      />
      <UiEntity
        uiTransform={{ width: 700, height: 90, margin: { bottom: 20 }, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
        uiText={{
          value: `${translate('finalScore')}: ${state.score}`,
          fontSize: 34,
          color: COLORS.cyan,
          textAlign: 'middle-center'
        }}
      />
      <UiEntity
        uiTransform={{ width: 620, height: 180, margin: { bottom: 22 }, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        {state.players
          .slice()
          .sort((first, second) => second.score - first.score || first.displayName.localeCompare(second.displayName))
          .slice(0, 5)
          .map((player, index) => (
            <UiEntity
              key={player.playerId}
              uiTransform={{ width: '100%', height: 30, alignItems: 'center', justifyContent: 'center' }}
              uiText={{
                value: `${index + 1}. ${player.displayName}  ${player.score}`,
                fontSize: 28,
                color: player.isSelf ? COLORS.cyan : COLORS.white,
                textAlign: 'middle-center'
              }}
            />
          ))}
        {state.socialSummary && (
          <UiEntity
            uiTransform={{ width: '100%', height: 34, margin: { top: 12 }, alignItems: 'center', justifyContent: 'center' }}
            uiText={{ value: formatSocialSummary(state.socialSummary), fontSize: 26, color: COLORS.green, textAlign: 'middle-center' }}
          />
        )}
      </UiEntity>
      <UiEntity
        uiTransform={{ width: 360, height: 76, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}
        uiBackground={{ color: COLORS.blue }}
        uiText={{ value: translate('playAgain'), fontSize: 28, color: COLORS.white, textAlign: 'middle-center' }}
        onMouseDown={() => game?.playAgain()}
      />
    </UiEntity>
  )
}

const RulesPanel = () => {
  if (!rulesOpen) return null

  return (
    <UiEntity
      uiTransform={{
        width: isMobileLayout() ? 800 : 820,
        height: isMobileLayout() ? 660 : 820,
        positionType: 'absolute',
        position: {
          top: isMobileLayout() ? 10 : 120,
          left: isMobileLayout() ? hudLeft(750) : centeredLeft(820)
        },
        flexDirection: 'column',
        alignItems: 'center',
        padding: { top: 20, bottom: 20, left: 28, right: 28 },
        borderRadius: 12
      }}
      uiBackground={{ color: COLORS.background }}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: 50, alignItems: 'center', justifyContent: 'center' }}
        uiText={{
          value: translate('rulesTitle'),
          fontSize: 30,
          color: COLORS.cyan,
          textAlign: 'middle-center'
        }}
      />
      <UiEntity
        uiTransform={{
          width: '100%',
          height: isMobileLayout() ? 420 : 480,
          margin: { top: 8, bottom: 12 },
          alignItems: 'flex-start',
          justifyContent: 'flex-start'
        }}
        uiText={{
          value: translate('rulesBody'),
          fontSize: isMobileLayout() ? 24 : 24,
          color: COLORS.white,
          textAlign: 'top-left'
        }}
      />
      <UiEntity
        uiTransform={{
          width: 200,
          height: 52,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10
        }}
        uiBackground={{ color: COLORS.blue }}
        uiText={{
          value: translate('rulesClose'),
          fontSize: 22,
          color: COLORS.white,
          textAlign: 'middle-center'
        }}
        onMouseDown={() => {
          rulesOpen = false
        }}
      />
    </UiEntity>
  )
}

function formatSocialSummary(summary: string): string {
  try {
    const parsed = JSON.parse(summary) as { trusted?: unknown; votes?: unknown }
    if (typeof parsed.trusted === 'string' && typeof parsed.votes === 'number') {
      return `Most Trusted: ${parsed.trusted} (${parsed.votes} votes)`
    }
  } catch {
    // plain string
  }
  return summary
}
