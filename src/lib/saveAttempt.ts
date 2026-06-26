import { supabase } from "./supabase";

export interface AttemptEvaluation {
  clip_id?: string;
  transcription?: string;
  fluency?: number;
  pronunciation?: number;
  completeness?: number;
  accuracy?: number;
  overall_score: number;
  feedback?: string;
}

/** Insert a phrase attempt, retrying with fewer columns if the schema is incomplete. */
export async function savePhraseAttempt(params: {
  userId: string;
  phraseId: string;
  targetLanguage?: string;
  evaluation: AttemptEvaluation;
  pointsEarned: number;
}): Promise<{ ok: boolean; error?: string }> {
  const { userId, phraseId, targetLanguage, evaluation, pointsEarned } = params;

  const minimal = {
    user_id: userId,
    phrase_id: phraseId,
    overall_score: evaluation.overall_score,
    points_earned: pointsEarned,
  };

  const extended = {
    ...minimal,
    ...(evaluation.clip_id ? { clip_id: evaluation.clip_id } : {}),
    ...(targetLanguage ? { target_language: targetLanguage } : {}),
    ...(evaluation.transcription != null ? { transcription: evaluation.transcription } : {}),
    ...(evaluation.fluency != null ? { fluency_score: evaluation.fluency } : {}),
    ...(evaluation.pronunciation != null ? { pronunciation_score: evaluation.pronunciation } : {}),
    ...(evaluation.completeness != null ? { completeness_score: evaluation.completeness } : {}),
    ...(evaluation.accuracy != null ? { accuracy_score: evaluation.accuracy } : {}),
    ...(evaluation.feedback != null ? { feedback: evaluation.feedback } : {}),
  };

  // Fallback to minimal insert only if extended fails (e.g. schema not yet migrated)
  let { error } = await supabase.from("user_phrase_attempts").insert(extended);
  if (error) {
    console.warn("Extended attempt insert failed, retrying minimal:", error.message);
    ({ error } = await supabase.from("user_phrase_attempts").insert(minimal));
  }

  if (error) {
    console.error("Insert error:", error.message, error.details, error.hint);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
