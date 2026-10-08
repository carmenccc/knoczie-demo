export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function snapshot(candidate: { wordId: string; lemma: string; score: number; reasons: string[] }) {
  return {
    wordId: candidate.wordId,
    lemma: candidate.lemma,
    score: candidate.score,
    reasons: candidate.reasons,
  };
}
