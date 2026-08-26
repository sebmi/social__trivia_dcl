import { Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

/**
 * Network messages for the authoritative Trivia server.
 */
export const TriviaMessages = {
  /** Client → Server : player chose language and joins lobby */
  ready: Schemas.Map({
    language: Schemas.String,
    displayName: Schemas.String
  }),

  /** Client → Server : any player can start the match from lobby */
  startGame: Schemas.Map({}),

  /** Client → Server : submit a custom question during COLLECTING */
  submitQuestion: Schemas.Map({
    question: Schemas.String,
    answerA: Schemas.String,
    answerB: Schemas.String,
    answerC: Schemas.String,
    correctAnswer: Schemas.Int
  }),

  /** Client → Server : answer current question */
  answer: Schemas.Map({
    answer: Schemas.Int
  }),

  /** Client → Server : social vote */
  socialVote: Schemas.Map({
    targetPlayerId: Schemas.String
  }),

  /** Client → Server : full restart */
  restart: Schemas.Map({}),

    /** Client → Server : leave the lobby */
  leaveLobby: Schemas.Map({}),

  /** Server → Client : identity */
  identity: Schemas.Map({
    playerId: Schemas.String
  }),

  /** Server → Client : full state */
  state: Schemas.Map({
    value: Schemas.String
  })
}

export const triviaRoom = registerMessages(TriviaMessages)
