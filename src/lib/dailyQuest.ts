/** Quest day starts at 8:00 AM local time and runs until the next 7:59:59 AM. */
export function getQuestDayStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(8, 0, 0, 0);
  if (date < start) {
    start.setDate(start.getDate() - 1);
  }
  return start;
}

export function isSameQuestDay(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return getQuestDayStart(d).getTime() === getQuestDayStart(now).getTime();
}

export type DailyQuestRow = {
  id: string;
  created_at: string;
  user_id: string | null;
  translation_sprint: boolean | null;
  accent_master: boolean | null;
  vocab_blitz: boolean | null;
  community_share: boolean | null;
};
