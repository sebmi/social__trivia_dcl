import { engine, Entity, Material, MeshCollider, MeshRenderer, TextShape, Transform } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { getLocalizedText } from './localization'
import { TriviaQuestion } from './questions'

export type AnswerIndex = 0 | 1 | 2

type Position = { x: number; y: number; z: number }

type AnswerPlatform = {
  entity: Entity
  label: Entity
  index: AnswerIndex
}

const PLATFORM_SCALE = Vector3.create(3.6, 0.25, 3.4)

/**
 * Déplace TOUTE l'arène en changeant uniquement cette valeur.
 * - Parcelle 1x1 centrée : (8, 0, 8)
 * - Parcelle 2x2 centrée : (16, 0, 16)
 */
export const ARENA_ORIGIN = Vector3.create(16, 0, 16)

const PLATFORM_POSITIONS = [
  Vector3.create(3, 0.15, 8),
  Vector3.create(8, 0.15, 8),
  Vector3.create(13, 0.15, 8)
] as const

const ANSWER_LETTERS = ['A', 'B', 'C'] as const

const COLORS = {
  idle: Color4.create(0.08, 0.16, 0.24, 1),
  selected: Color4.create(0.05, 0.72, 0.9, 1),
  correct: Color4.create(0.12, 0.78, 0.38, 1),
  wrong: Color4.create(0.82, 0.16, 0.2, 1)
}

const ARENA_FLOOR_HALF_SIZE = 7.9
const ARENA_FLOOR_CENTER = 8

/** True si le joueur local est sur le sol de l'arène. */
export function isPlayerInArena(): boolean {
  if (!Transform.has(engine.PlayerEntity)) return false

  const position = Transform.get(engine.PlayerEntity).position
  return (
    Math.abs(position.x - ARENA_ORIGIN.x - ARENA_FLOOR_CENTER) <= ARENA_FLOOR_HALF_SIZE &&
    Math.abs(position.z - ARENA_ORIGIN.z - ARENA_FLOOR_CENTER) <= ARENA_FLOOR_HALF_SIZE
  )
}

export class PlatformManager {
  private readonly root: Entity
  private readonly platforms: AnswerPlatform[]

  constructor() {
    this.root = engine.addEntity()
    Transform.create(this.root, { position: ARENA_ORIGIN })

    this.createArenaFloor()
    //this.createQuestionBoard()
    this.platforms = PLATFORM_POSITIONS.map((position, index) =>
      this.createPlatform(index as AnswerIndex, position)
    )
  }

  setQuestion(question: TriviaQuestion): void {
    for (const platform of this.platforms) {
      TextShape.getMutable(platform.label).text = `${ANSWER_LETTERS[platform.index]}\n${getLocalizedText(
        question.answers[platform.index]
      )}`
    }
    this.showSelection(null)
  }

  getAnswerAtPosition(position: Position): AnswerIndex | null {
    const localX = position.x - ARENA_ORIGIN.x
    const localZ = position.z - ARENA_ORIGIN.z

    for (const platform of this.platforms) {
      const transform = Transform.get(platform.entity)
      const halfWidth = transform.scale.x / 2
      const halfDepth = transform.scale.z / 2
      const margin = 0.15

      if (
        Math.abs(localX - transform.position.x) <= halfWidth + margin &&
        Math.abs(localZ - transform.position.z) <= halfDepth + margin
      ) {
        return platform.index
      }
    }
    return null
  }

  showSelection(selectedAnswer: AnswerIndex | null): void {
    for (const platform of this.platforms) {
      this.setPlatformColor(platform.entity, platform.index === selectedAnswer ? COLORS.selected : COLORS.idle)
      Transform.getMutable(platform.entity).position.y = platform.index === selectedAnswer ? 0.25 : 0.15
    }
  }

  showCorrectAnswer(correctAnswer: AnswerIndex, selectedAnswer: AnswerIndex | null): void {
    for (const platform of this.platforms) {
      const color = platform.index === correctAnswer ? COLORS.correct : COLORS.wrong
      this.setPlatformColor(platform.entity, color)
      Transform.getMutable(platform.entity).position.y = platform.index === correctAnswer ? 0.3 : 0.15
    }

    if (selectedAnswer !== null && selectedAnswer !== correctAnswer) {
      this.setPlatformColor(this.platforms[selectedAnswer].entity, COLORS.wrong)
    }
  }

  private createArenaFloor(): void {
    const floor = engine.addEntity()
    Transform.create(floor, {
      parent: this.root,
      position: Vector3.create(8, 0.02, 8),
      scale: Vector3.create(15.8, 0.08, 15.8)
    })
    MeshRenderer.setBox(floor)
    Material.setPbrMaterial(floor, {
      albedoColor: Color4.create(0.025, 0.04, 0.07, 1),
      metallic: 0.35,
      roughness: 0.7
    })
  }

/*  private createQuestionBoard(): void {
    const board = engine.addEntity()
    Transform.create(board, {
      parent: this.root,
      position: Vector3.create(8, 5.6, 14.7),
      scale: Vector3.create(13, 2.4, 0.2)
    })
    MeshRenderer.setBox(board)
    Material.setPbrMaterial(board, {
      albedoColor: Color4.create(0.03, 0.1, 0.16, 1),
      emissiveColor: Color4.create(0.02, 0.24, 0.34, 1),
      emissiveIntensity: 1.2,
      metallic: 0.5,
      roughness: 0.35
    })

    const title = engine.addEntity()
    Transform.create(title, {
      parent: board,
      position: Vector3.create(0, 0, -0.6),
      rotation: Quaternion.fromEulerDegrees(0, 0, 0),
      scale: Vector3.create(0.08, 0.42, 1)
    })
    TextShape.create(title, {
      text: 'TRIVIA',
      fontSize: 10,
      textColor: Color4.create(0.2, 0.9, 1, 1),
      outlineColor: Color4.create(0, 0.05, 0.08, 1),
      outlineWidth: 0.12
    })
  }
    */

  private createPlatform(index: AnswerIndex, position: Position): AnswerPlatform {
    const entity = engine.addEntity()
    Transform.create(entity, {
      parent: this.root,
      position,
      scale: PLATFORM_SCALE
    })
    MeshRenderer.setBox(entity)
    MeshCollider.setBox(entity)
    this.setPlatformColor(entity, COLORS.idle)

    const label = engine.addEntity()
    Transform.create(label, {
      parent: this.root,
      position: Vector3.create(position.x, 1.1, position.z + 1.55),
      rotation: Quaternion.fromEulerDegrees(0, 0, 0),
      scale: Vector3.create(0.18, 0.18, 0.18)
    })
    TextShape.create(label, {
      text: ANSWER_LETTERS[index],
      fontSize: 20,
      textColor: Color4.White(),
      outlineColor: Color4.Black(),
      outlineWidth: 0.12
    })

    return { entity, label, index }
  }

  private setPlatformColor(entity: Entity, color: Color4): void {
    Material.setPbrMaterial(entity, {
      albedoColor: color,
      emissiveColor: Color4.create(color.r * 0.45, color.g * 0.45, color.b * 0.45, 1),
      emissiveIntensity: 1.4,
      metallic: 0.55,
      roughness: 0.3
    })
  }
}
