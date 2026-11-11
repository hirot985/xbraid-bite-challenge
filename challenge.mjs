export const ROUND_COUNT = 2;
export const isChallengeComplete = rounds => rounds.length >= ROUND_COUNT;
export const remainingRounds = rounds => Math.max(0, ROUND_COUNT - rounds.length);
