export const SUPPORTED_LANGUAGES = [
  'fr',
  'en',
  'es',
  'de',
  'pt',
  'zh',
  'ja',
  'ru'
] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export type LocalizedText = Partial<Record<string, string>> & { en: string }

export type UiTextKey =
  | 'chooseLanguage'
  | 'score'
  | 'correct'
  | 'wrong'
  | 'timeUp'
  | 'selected'
  | 'getReady'
  | 'reveal'
  | 'nextQuestion'
  | 'gameOver'
  | 'finalScore'
  | 'playAgain'
  | 'collectingTitle'
  | 'collectingHint'
  | 'remainingSlots'
  | 'remainingTime'
  | 'questionPlaceholder'
  | 'answerAPlaceholder'
  | 'answerBPlaceholder'
  | 'answerCPlaceholder'
  | 'correctAnswerLabel'
  | 'submitQuestion'
  | 'questionSubmitted'
  | 'waitingForQuestions'
  | 'noQuestionsYet'
  | 'startWithWhatWeHave'
  | 'lobbyTitle'
  | 'lobbyHint'
  | 'lobbyPlayers'
  | 'startGame'
  | 'waitingPlayers'
  | 'rulesButton'
  | 'rulesTitle'
  | 'rulesClose'
  | 'rulesBody'
  | 'leaveLobby'

const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

const languageNames: Record<SupportedLanguage, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  pt: 'Português',
  zh: '中文',
  ja: '日本語',
  ru: 'Русский'
}

const uiTranslations: Record<UiTextKey, LocalizedText> = {
  chooseLanguage: {
    fr: 'Choisissez votre langue',
    en: 'Choose your language',
    es: 'Elige tu idioma',
    de: 'Wähle deine Sprache',
    pt: 'Escolha o seu idioma',
    zh: '选择你的语言',
    ja: '言語を選んでください',
    ru: 'Выберите язык'
  },
  score: {
    fr: 'Score',
    en: 'Score',
    es: 'Puntuación',
    de: 'Punkte',
    pt: 'Pontuação',
    zh: '得分',
    ja: 'スコア',
    ru: 'Счёт'
  },
  correct: {
    fr: 'Bonne réponse !',
    en: 'Correct!',
    es: '¡Correcto!',
    de: 'Richtig!',
    pt: 'Resposta correta!',
    zh: '回答正确！',
    ja: '正解！',
    ru: 'Правильно!'
  },
  wrong: {
    fr: 'Mauvaise réponse',
    en: 'Wrong answer',
    es: 'Respuesta incorrecta',
    de: 'Falsche Antwort',
    pt: 'Resposta errada',
    zh: '回答错误',
    ja: '不正解',
    ru: 'Неправильно'
  },
  timeUp: {
    fr: 'Temps écoulé !',
    en: "Time's up!",
    es: '¡Tiempo!',
    de: 'Zeit abgelaufen!',
    pt: 'Tempo esgotado!',
    zh: '时间到！',
    ja: '時間切れ！',
    ru: 'Время вышло!'
  },
  selected: {
    fr: 'Sélection',
    en: 'Selected',
    es: 'Selección',
    de: 'Ausgewählt',
    pt: 'Selecionado',
    zh: '已选择',
    ja: '選択中',
    ru: 'Выбрано'
  },
  getReady: {
    fr: 'Préparez-vous !',
    en: 'Get ready!',
    es: '¡Prepárate!',
    de: 'Mach dich bereit!',
    pt: 'Prepare-se!',
    zh: '准备好！',
    ja: '準備してください！',
    ru: 'Приготовьтесь!'
  },
  reveal: {
    fr: 'Bonne réponse',
    en: 'Correct answer',
    es: 'Respuesta correcta',
    de: 'Richtige Antwort',
    pt: 'Resposta correta',
    zh: '正确答案',
    ja: '正解',
    ru: 'Правильный ответ'
  },
  nextQuestion: {
    fr: 'Question suivante...',
    en: 'Next question...',
    es: 'Siguiente pregunta...',
    de: 'Nächste Frage...',
    pt: 'Próxima pergunta...',
    zh: '下一题...',
    ja: '次の質問...',
    ru: 'Следующий вопрос...'
  },
  gameOver: {
    fr: 'Partie terminée',
    en: 'Game over',
    es: 'Fin de la partida',
    de: 'Spiel beendet',
    pt: 'Fim de jogo',
    zh: '游戏结束',
    ja: 'ゲーム終了',
    ru: 'Игра окончена'
  },
  finalScore: {
    fr: 'Score final',
    en: 'Final score',
    es: 'Puntuación final',
    de: 'Endpunktzahl',
    pt: 'Pontuação final',
    zh: '最终得分',
    ja: '最終スコア',
    ru: 'Итоговый счёт'
  },
  playAgain: {
    fr: 'Retour au lobby',
    en: 'Back to lobby',
    es: 'Volver al lobby',
    de: 'Zurück zur Lobby',
    pt: 'Voltar ao lobby',
    zh: '返回大厅',
    ja: 'ロビーに戻る',
    ru: 'Вернуться в лобби'
  },
  collectingTitle: {
    fr: 'Créez vos questions !',
    en: 'Create your questions!',
    es: '¡Crea tus preguntas!',
    de: 'Erstelle deine Fragen!',
    pt: 'Crie suas perguntas!',
    zh: '创建你的问题！',
    ja: '質問を作成しよう！',
    ru: 'Создайте свои вопросы!'
  },
  collectingHint: {
    fr: 'Vous avez 120 secondes. Max 12 questions au total.',
    en: 'You have 120 seconds. Max 12 questions total.',
    es: 'Tienes 120 segundos. Máx 12 preguntas en total.',
    de: 'Du hast 120 Sekunden. Max. 12 Fragen insgesamt.',
    pt: 'Você tem 120 segundos. Máx. 12 perguntas no total.',
    zh: '你有120秒。最多12个问题。',
    ja: '120秒あります。最大12問まで。',
    ru: 'У вас 120 секунд. Максимум 12 вопросов.'
  },
  remainingSlots: {
    fr: 'Places restantes',
    en: 'Slots remaining',
    es: 'Espacios restantes',
    de: 'Verbleibende Plätze',
    pt: 'Vagas restantes',
    zh: '剩余名额',
    ja: '残り枠',
    ru: 'Осталось мест'
  },
  remainingTime: {
    fr: 'Temps restant',
    en: 'Time remaining',
    es: 'Tiempo restante',
    de: 'Verbleibende Zeit',
    pt: 'Tempo restante',
    zh: '剩余时间',
    ja: '残り時間',
    ru: 'Оставшееся время'
  },
  questionPlaceholder: {
    fr: 'Écrivez votre question ici...',
    en: 'Write your question here...',
    es: 'Escribe tu pregunta aquí...',
    de: 'Schreibe deine Frage hier...',
    pt: 'Escreva sua pergunta aqui...',
    zh: '在这里写下你的问题...',
    ja: 'ここに質問を書いてください...',
    ru: 'Напишите ваш вопрос здесь...'
  },
  answerAPlaceholder: {
    fr: 'Réponse A',
    en: 'Answer A',
    es: 'Respuesta A',
    de: 'Antwort A',
    pt: 'Resposta A',
    zh: '答案 A',
    ja: '回答 A',
    ru: 'Ответ A'
  },
  answerBPlaceholder: {
    fr: 'Réponse B',
    en: 'Answer B',
    es: 'Respuesta B',
    de: 'Antwort B',
    pt: 'Resposta B',
    zh: '答案 B',
    ja: '回答 B',
    ru: 'Ответ B'
  },
  answerCPlaceholder: {
    fr: 'Réponse C',
    en: 'Answer C',
    es: 'Respuesta C',
    de: 'Antwort C',
    pt: 'Resposta C',
    zh: '答案 C',
    ja: '回答 C',
    ru: 'Ответ C'
  },
  correctAnswerLabel: {
    fr: 'Bonne réponse :',
    en: 'Correct answer:',
    es: 'Respuesta correcta:',
    de: 'Richtige Antwort:',
    pt: 'Resposta correta:',
    zh: '正确答案：',
    ja: '正解：',
    ru: 'Правильный ответ:'
  },
  submitQuestion: {
    fr: 'Envoyer la question',
    en: 'Submit question',
    es: 'Enviar pregunta',
    de: 'Frage absenden',
    pt: 'Enviar pergunta',
    zh: '提交问题',
    ja: '質問を送信',
    ru: 'Отправить вопрос'
  },
  questionSubmitted: {
    fr: 'Question envoyée !',
    en: 'Question submitted!',
    es: '¡Pregunta enviada!',
    de: 'Frage gesendet!',
    pt: 'Pergunta enviada!',
    zh: '问题已提交！',
    ja: '質問が送信されました！',
    ru: 'Вопрос отправлен!'
  },
  waitingForQuestions: {
    fr: 'En attente de questions...',
    en: 'Waiting for questions...',
    es: 'Esperando preguntas...',
    de: 'Warte auf Fragen...',
    pt: 'Aguardando perguntas...',
    zh: '等待问题中...',
    ja: '質問を待っています...',
    ru: 'Ожидание вопросов...'
  },
  noQuestionsYet: {
    fr: 'Aucune question pour l’instant',
    en: 'No questions yet',
    es: 'Aún no hay preguntas',
    de: 'Noch keine Fragen',
    pt: 'Nenhuma pergunta ainda',
    zh: '还没有问题',
    ja: 'まだ質問がありません',
    ru: 'Пока нет вопросов'
  },
  startWithWhatWeHave: {
    fr: 'On démarre avec ce qu’on a',
    en: 'Starting with what we have',
    es: 'Empezamos con lo que tenemos',
    de: 'Wir starten mit dem, was wir haben',
    pt: 'Começamos com o que temos',
    zh: '我们从现有的开始',
    ja: 'あるもので始めます',
    ru: 'Начинаем с того, что есть'
  },
  lobbyTitle: {
    fr: 'Lobby',
    en: 'Lobby',
    es: 'Lobby',
    de: 'Lobby',
    pt: 'Lobby',
    zh: '大厅',
    ja: 'ロビー',
    ru: 'Лобби'
  },
  lobbyHint: {
    fr: 'Assurez-vous que vos amis soient prêts avant de lancer la partie.',
    en: 'Make sure your friends are ready before starting the game.',
    es: 'Asegúrate de que tus amigos estén listos antes de empezar.',
    de: 'Stelle sicher, dass deine Freunde bereit sind, bevor du startest.',
    pt: 'Certifique-se de que seus amigos estão prontos antes de começar.',
    zh: '开始前请确保你的朋友都准备好了。',
    ja: 'スタートする前に友達の準備ができているか確認してください。',
    ru: 'Убедитесь, что друзья готовы, прежде чем начинать.'
  },
  lobbyPlayers: {
    fr: 'Joueurs prêts',
    en: 'Players ready',
    es: 'Jugadores listos',
    de: 'Bereite Spieler',
    pt: 'Jogadores prontos',
    zh: '已准备的玩家',
    ja: '準備完了のプレイヤー',
    ru: 'Игроки готовы'
  },
  startGame: {
    fr: 'Démarrer la partie',
    en: 'Start game',
    es: 'Empezar partida',
    de: 'Spiel starten',
    pt: 'Começar jogo',
    zh: '开始游戏',
    ja: 'ゲームを開始',
    ru: 'Начать игру'
  },
  waitingPlayers: {
    fr: 'En attente de joueurs…',
    en: 'Waiting for players…',
    es: 'Esperando jugadores…',
    de: 'Warte auf Spieler…',
    pt: 'Aguardando jogadores…',
    zh: '等待玩家…',
    ja: 'プレイヤーを待っています…',
    ru: 'Ожидание игроков…'
  },
    rulesButton: {
    fr: '?',
    en: '?',
    es: '?',
    de: '?',
    pt: '?',
    zh: '?',
    ja: '?',
    ru: '?'
  },
  rulesTitle: {
    fr: 'Comment gagner des points',
    en: 'How points work',
    es: 'Cómo se ganan puntos',
    de: 'So funktionieren Punkte',
    pt: 'Como funcionam os pontos',
    zh: '积分说明',
    ja: 'ポイントの仕組み',
    ru: 'Как начисляются очки'
  },
  rulesClose: {
    fr: 'Fermer',
    en: 'Close',
    es: 'Cerrar',
    de: 'Schließen',
    pt: 'Fechar',
    zh: '关闭',
    ja: '閉じる',
    ru: 'Закрыть'
  },
  rulesBody: {
    fr: '1) Créez vos questions\nChacun propose des questions pour le trivia.\n\n2) Répondez vite\n• 10–15 s restantes → 100 pts\n• 5–10 s restantes → 75 pts\n• moins de 5 s → 50 pts\n\n3) Choisissez un partenaire\nVotez pour le joueur en qui vous avez le plus confiance.\n• Most Trusted → +88 pts\n• Match (vote mutuel) → +69 pts\n• Friendzoné → +22 pts\n• Ignoré → +11 pts\n\nAstuce : N’ignorez personne : un vote peut tout changer.',
    en: '1) Create your questions\nEveryone submits questions for the trivia.\n\n2) Answer fast\n• 10–15 s left → 100 pts\n• 5–10 s left → 75 pts\n• under 5 s → 50 pts\n\n3) Choose a partner\nVote for the player you trust the most.\n• Most Trusted → +88 pts\n• Match (mutual vote) → +69 pts\n• Friendzoned → +22 pts\n• Ignored → +11 pts\n\nTip: Don’t ignore anyone — one vote can change everything.',
    es: '1) Cread vuestras preguntas\nCada uno propone preguntas para el trivia.\n\n2) Responde rápido\n• 10–15 s restantes → 100 pts\n• 5–10 s restantes → 75 pts\n• menos de 5 s → 50 pts\n\n3) Elige un compañero\nVota por el jugador en quien más confías.\n• Most Trusted → +88 pts\n• Match (voto mutuo) → +69 pts\n• Friendzoned → +22 pts\n• Ignored → +11 pts\n\nConsejo: No ignores a nadie: un voto puede cambiarlo todo.',
    de: '1) Erstellt eure Fragen\nJeder schlägt Fragen für das Trivia vor.\n\n2) Schnell antworten\n• 10–15 s übrig → 100 Pkt\n• 5–10 s übrig → 75 Pkt\n• unter 5 s → 50 Pkt\n\n3) Wählt einen Partner\nStimmt für den Spieler, dem ihr am meisten vertraut.\n• Most Trusted → +88 Pkt\n• Match (gegenseitig) → +69 Pkt\n• Friendzoned → +22 Pkt\n• Ignored → +11 Pkt\n\nTipp: Ignoriere niemanden — eine Stimme kann alles ändern.',
    pt: '1) Criem as perguntas\nCada um propõe perguntas para o trivia.\n\n2) Respondam rápido\n• 10–15 s restantes → 100 pts\n• 5–10 s restantes → 75 pts\n• menos de 5 s → 50 pts\n\n3) Escolham um parceiro\nVotem no jogador em quem mais confiam.\n• Most Trusted → +88 pts\n• Match (voto mútuo) → +69 pts\n• Friendzoned → +22 pts\n• Ignored → +11 pts\n\nDica: Não ignore ninguém: um voto pode mudar tudo.',
    zh: '1) 创建问题\n每位玩家为问答赛提交问题。\n\n2) 快速作答\n• 剩余 10–15 秒 → 100 分\n• 剩余 5–10 秒 → 75 分\n• 不足 5 秒 → 50 分\n\n3) 选择搭档\n投票给你最信任的玩家。\n• Most Trusted → +88 分\n• Match（互相投票）→ +69 分\n• Friendzoned → +22 分\n• Ignored → +11 分\n\n提示：不要忽略任何人——一票可能改变一切。',
    ja: '1) 問題を作る\nみんながトリビア用の問題を出します。\n\n2) すばやく答える\n• 残り 10–15 秒 → 100 pts\n• 残り 5–10 秒 → 75 pts\n• 5 秒未満 → 50 pts\n\n3) パートナーを選ぶ\nいちばん信頼するプレイヤーに投票します。\n• Most Trusted → +88 pts\n• Match（相互投票）→ +69 pts\n• Friendzoned → +22 pts\n• Ignored → +11 pts\n\nヒント： 誰も無視しないで。1票がすべてを変えるかも。',
    ru: '1) Создайте вопросы\nКаждый предлагает вопросы для викторины.\n\n2) Отвечайте быстро\n• 10–15 с осталось → 100 очков\n• 5–10 с осталось → 75 очков\n• меньше 5 с → 50 очков\n\n3) Выберите партнёра\nГолосуйте за игрока, которому доверяете больше всего.\n• Most Trusted → +88\n• Match (взаимно) → +69\n• Friendzoned → +22\n• Ignored → +11\n\nПодсказка: Никого не игнорируйте — один голос может всё изменить.'
  },
    leaveLobby: {
    fr: 'Quitter',
    en: 'Leave',
    es: 'Salir',
    de: 'Verlassen',
    pt: 'Sair',
    zh: '离开',
    ja: '退出',
    ru: 'Выйти'
  }
}

let currentLanguage: SupportedLanguage = DEFAULT_LANGUAGE

export function setCurrentLanguage(language: SupportedLanguage): void {
  currentLanguage = language
}

export function getCurrentLanguage(): SupportedLanguage {
  return currentLanguage
}

export function getLanguageName(language: SupportedLanguage): string {
  return languageNames[language]
}

export function getLocalizedText(text: LocalizedText, language: string = currentLanguage): string {
  return text[language] ?? text[DEFAULT_LANGUAGE] ?? Object.values(text).find(Boolean) ?? ''
}

export function translate(key: UiTextKey): string {
  return getLocalizedText(uiTranslations[key])
}
