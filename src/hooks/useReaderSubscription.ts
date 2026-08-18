import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ReaderSubscription {
  isActive: boolean;
  expiresAt: Date | null;
  daysLeft: number;
  isLoading: boolean;
  refetch: () => void;
}

export const useReaderSubscription = (): ReaderSubscription => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["reader-subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("reader_expires_at")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.reader_expires_at as string | null) ?? null;
    },
    enabled: !!user,
  });

  const expiresAt = data ? new Date(data) : null;
  // 2026-08-18: everything is free now (Abraham's call) - every signed-in
  // reader has full access. Kept the query for the account's own expiry info.
  const isActive = true;
  const daysLeft = expiresAt
    ? Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000))
    : 0;

  return {
    isActive,
    expiresAt,
    daysLeft,
    isLoading: isLoading || !user,
    refetch: () => {
      void queryClient.invalidateQueries({ queryKey: ["reader-subscription", user?.id] });
      void refetch();
    },
  };
};
