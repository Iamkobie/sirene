import { supabase } from "./supabase";

/** Quest day starts at 8:00 AM local time and runs until the next 7:59:59 AM. */
export function getQuestDayStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(8, 0, 0, 0);
  if (date < start) {
    start.setDate(start.getDate() - 1);
  }
  return start;
}

export function getQuestDayBounds(forDate: Date = new Date()): { start: Date; end: Date } {
  const start = getQuestDayStart(forDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function isSameQuestDay(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return getQuestDayStart(d).getTime() === getQuestDayStart(now).getTime();
}

export type DailyQuestFlags = {
  translation_sprint: boolean;
  accent_master: boolean;
  vocab_blitz: boolean;
  community_share: boolean;
};

export type DailyQuestRow = DailyQuestFlags & {
  id: string;
  created_at: string;
  user_id: string | null;
};

export const EMPTY_QUEST_FLAGS: DailyQuestFlags = {
  translation_sprint: false,
  accent_master: false,
  vocab_blitz: false,
  community_share: false,
};

export function flagsFromRow(row: DailyQuestRow | null | undefined): DailyQuestFlags {
  if (!row) return { ...EMPTY_QUEST_FLAGS };
  return {
    translation_sprint: row.translation_sprint === true,
    accent_master: row.accent_master === true,
    vocab_blitz: row.vocab_blitz === true,
    community_share: row.community_share === true,
  };
}

/** Fetch the daily_quest row for the current quest day (8 AM boundary). */
export async function fetchTodayDailyQuest(userId: string): Promise<DailyQuestRow | null> {
  const { start, end } = getQuestDayBounds();

  const { data, error } = await supabase
    .from("daily_quest")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fetchTodayDailyQuest:", error.message, error);
    throw error;
  }

  return data;
}

/** Update or insert today's vocab_blitz completion. */
export async function markVocabBlitzComplete(userId: string): Promise<void> {
  const existing = await fetchTodayDailyQuest(userId);

  if (existing) {
    const { error } = await supabase
      .from("daily_quest")
      .update({ vocab_blitz: true })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("daily_quest")
    .insert({ user_id: userId, vocab_blitz: true });
  if (error) throw error;
}
