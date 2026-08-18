import { useCallback, useState } from "react";

/**
 * 2026-08-18: books and games are FREE for everyone (Abraham's call - we don't
 * charge for the gospel). The purchase/phone-claim unlock wall is retired;
 * every game is playable. The RPC + game_access table stay in the database
 * for history, but nothing is gated on them anymore.
 */
export function useGameAccess() {
  const [unlocked, setUnlocked] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  const claim = useCallback(
    async (_phone: string): Promise<{ ok: boolean; reason?: string }> => {
      setUnlocked(true);
      return { ok: true };
    },
    []
  );

  return { unlocked, loading, claim };
}
