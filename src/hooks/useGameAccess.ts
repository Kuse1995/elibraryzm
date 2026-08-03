import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "elibrary_games_unlocked";

/**
 * Games are a free, forever perk for readers who bought a book.
 * - Signed-in buyers: grant is bound to their account (checked via edge fn).
 * - WhatsApp/guest buyers: unlock once with the phone number they ordered with;
 *   the pass binds to their account if they are signed in, and a local flag
 *   keeps them unlocked on this device.
 */
export function useGameAccess() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState<boolean>(
    () => typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === "1") {
          setUnlocked(true);
          setLoading(false);
          return;
        }
        if (!user) {
          setUnlocked(false);
          setLoading(false);
          return;
        }
        const { data } = await supabase.functions.invoke("game-access-check", {
          body: { mode: "me" },
        });
        if (!alive) return;
        if (data && data.granted) {
          localStorage.setItem(STORAGE_KEY, "1");
          setUnlocked(true);
        } else {
          setUnlocked(false);
        }
      } catch {
        if (alive) setUnlocked(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const claim = useCallback(
    async (phone: string): Promise<{ ok: boolean; reason?: string }> => {
      const { data, error } = await supabase.functions.invoke("game-access-check", {
        body: { phone },
      });
      if (!error && data && data.granted) {
        localStorage.setItem(STORAGE_KEY, "1");
        setUnlocked(true);
        return { ok: true };
      }
      return { ok: false, reason: data?.reason || "unlock_failed" };
    },
    []
  );

  return { unlocked, loading, claim };
}
