# Trivia – Authoritative Server (player-created questions)

## Ce qui a changé

- Nouvelle phase **COLLECTING** (60 secondes)
- Les joueurs créent leurs propres questions
- Maximum **12 questions** au total
- Un joueur peut en soumettre plusieurs tant qu’il reste de la place
- Validation serveur (longueur + 3 réponses + bonne réponse valide)
- Filtre de mots interdits présent mais **vide**
- On joue **toutes** les questions soumises (dans un ordre aléatoire)
- Leaderboard global retiré → parties uniques uniquement

## Fichiers à remplacer / ajouter

Copie simplement tous les fichiers de ce dossier dans ton projet de scène (remplace les anciens) :

| Fichier              | Action                          |
|----------------------|---------------------------------|
| `messages.ts`        | Remplacer                       |
| `nativeServer.ts`    | Remplacer                       |
| `serverGame.ts`      | Remplacer                       |
| `game.ts`            | Remplacer                       |
| `ui.tsx`             | Remplacer                       |
| `localization.ts`    | Remplacer                       |
| `questions.ts`       | Remplacer                       |
| `platforms.ts`       | Remplacer (identique)           |
| `score.ts`           | Remplacer (identique)           |
| `questionSource.ts`  | Remplacer (identique)           |

## Comment le serveur démarre

Dans ton `index.ts` (ou le fichier d’entrée) tu dois déjà avoir quelque chose comme :

```ts
import { initTriviaServer } from './nativeServer'
import { isServer } from '@dcl/sdk/network'

export function main() {
  if (isServer()) {
    initTriviaServer()
  }
  // ... reste de ton code client (PlatformManager, ServerTriviaGame, setTriviaGame, etc.)
}
```

Le client continue d’utiliser `ServerTriviaGame` comme avant.

## Flow joueur

1. Choix de la langue
2. Phase COLLECTING (60 s) → formulaire pour créer des questions
3. Dès que le timer est fini **ou** que 12 questions sont atteintes → la partie commence
4. Même logique QUESTION → SOCIAL_VOTE → REVEAL qu’avant
5. À la fin → bouton « Rejouer » qui remet tout à zéro (nouvelle phase COLLECTING)

## Validation des questions (serveur)

- Question : 8 à 180 caractères
- Chaque réponse : 1 à 80 caractères
- `correctAnswer` doit être 0, 1 ou 2
- Filtre de mots interdits : tableau `FORBIDDEN_WORDS` (actuellement vide)

## Notes importantes

- Les questions sont stockées **uniquement en mémoire** du serveur pour la durée de la session.
- Aucun leaderboard global.
- Le mode local (`TriviaGame`) reste un fallback simple avec les 3 questions DEV.
