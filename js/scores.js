export const HIGH_SCORES_KEY = "vibey_high_scores";
export const DISPLAY_HIGH_SCORE_COUNT = 5;

export function loadHighScores() {
  try {
    return JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveHighScores(scores) {
  localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
}

export function addHighScore(name, score, reachedLevel) {
  const scores = loadHighScores();
  scores.push({ name, score, level: reachedLevel });
  scores.sort((a, b) => b.score - a.score);
  if (scores.length > 10) scores.length = 10;
  saveHighScores(scores);
}

export function qualifiesForHighScore(score) {
  const scores = loadHighScores();
  scores.sort((a, b) => b.score - a.score);
  if (scores.length < DISPLAY_HIGH_SCORE_COUNT) return true;
  return score >= scores[DISPLAY_HIGH_SCORE_COUNT - 1].score;
}
