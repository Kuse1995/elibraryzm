import { useCallback, useState } from "react";

export type GameStats = { plays: number; best: number; lastPlayed: number };

const KEY = "elibrary.games.v1";

function readAll(): Record<string, GameStats> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, GameStats>) : {};
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, GameStats>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function useGameStats(gameId: string) {
  const [stats, setStats] = useState<GameStats>(() => readAll()[gameId] || { plays: 0, best: 0, lastPlayed: 0 });

  const record = useCallback(
    (score: number) => {
      setStats((prev) => {
        const next: GameStats = {
          plays: prev.plays + 1,
          best: Math.max(prev.best, score),
          lastPlayed: Date.now(),
        };
        const all = readAll();
        all[gameId] = next;
        writeAll(all);
        return next;
      });
    },
    [gameId]
  );

  return { stats, record };
}

export function getAllStats(): Record<string, GameStats> {
  return readAll();
}
