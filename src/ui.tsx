import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { TriviaController } from './trivia/game'
import { setTriviaGame, TriviaUI } from './trivia/ui'

export type UiLayer = 'none' | 'trivia'

let activeLayer: UiLayer = 'trivia'
let rendererMounted = false

export function setActiveUiLayer(layer: UiLayer): void {
  activeLayer = layer
}

export function getActiveUiLayer(): UiLayer {
  return activeLayer
}

export function setupUi(game: TriviaController): void {
  setTriviaGame(game)
  if (rendererMounted) return

  rendererMounted = true
  ReactEcsRenderer.setUiRenderer(SceneUiRoot, { virtualWidth: 1920, virtualHeight: 1080 })
}

export const SceneUiRoot = () => {
  if (activeLayer === 'trivia') return <TriviaUI />

  return <UiEntity />
}