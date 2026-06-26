import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router";
import { supabase } from "../../lib/supabase";
import {
  fetchTodayDailyQuest,
  flagsFromRow,
  EMPTY_QUEST_FLAGS,
  type DailyQuestFlags,
} from "../../lib/dailyQuest";

export function useDailyQuest() {
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flags, setFlags] = useState<DailyQuestFlags>({ ...EMPTY_QUEST_FLAGS });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFlags({ ...EMPTY_QUEST_FLAGS });
        return;
      }

      const row = await fetchTodayDailyQuest(user.id);
      setFlags(flagsFromRow(row));
    } catch (err: any) {
      console.error("Error loading daily quests:", err);
      setError(err?.message ?? "Failed to load daily quests");
      setFlags({ ...EMPTY_QUEST_FLAGS });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/daily") return;
    reload();
  }, [pathname, reload]);

  useEffect(() => {
    if (pathname !== "/daily") return;

    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onVisible);

    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel(`daily_quest:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "daily_quest",
            filter: `user_id=eq.${user.id}`,
          },
          () => reload(),
        )
        .subscribe();
    });

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) supabase.removeChannel(channel);
    };
  }, [pathname, reload]);

  return { flags, loading, error, reload };
}
