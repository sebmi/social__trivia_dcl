import { engine } from '@dcl/sdk/ecs'
import { isServer } from '@dcl/sdk/network'
import { TriviaGame } from './trivia/game'
import { PlatformManager } from './trivia/platforms'
import { ServerTriviaGame } from './trivia/serverGame'
import { initTriviaServer } from './trivia/nativeServer'
import { setupUi } from './ui'

export function main() {
  if (isServer()) {
    initTriviaServer()
    return
  }

  const platforms = new PlatformManager()
  const game = new ServerTriviaGame(platforms)

  engine.addSystem(() => game.update())
  setupUi(game)
}

