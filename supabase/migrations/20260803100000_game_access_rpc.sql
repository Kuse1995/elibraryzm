-- game_access_check RPC: replaces the game-access-check edge function.
-- Security definer so anon/authenticated callers can check their grant
-- without direct table access (RLS still protects direct reads).

CREATE OR REPLACE FUNCTION public.game_access_check(p_mode TEXT DEFAULT 'phone', p_phone TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_row public.game_access%ROWTYPE;
  v_canon text := '';
BEGIN
  IF p_mode = 'me' THEN
    IF v_user_id IS NULL THEN
      RETURN jsonb_build_object('granted', false, 'reason', 'not_signed_in');
    END IF;
    SELECT * INTO v_row FROM public.game_access
      WHERE user_id = v_user_id AND active ORDER BY created_at DESC LIMIT 1;
    RETURN jsonb_build_object('granted', v_row.id IS NOT NULL);
  END IF;

  v_canon := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_canon := right(v_canon, 9);
  IF length(v_canon) < 9 THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'invalid_phone');
  END IF;

  IF v_user_id IS NOT NULL THEN
    SELECT * INTO v_row FROM public.game_access
      WHERE user_id = v_user_id AND active ORDER BY created_at DESC LIMIT 1;
    IF v_row.id IS NOT NULL THEN
      RETURN jsonb_build_object('granted', true, 'already', true);
    END IF;
  END IF;

  SELECT * INTO v_row FROM public.game_access
    WHERE active AND phone IS NOT NULL
      AND right(regexp_replace(phone, '\D', '', 'g'), 9) = v_canon
    ORDER BY created_at DESC LIMIT 1;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'no_pass');
  END IF;

  IF v_user_id IS NOT NULL AND v_row.user_id IS NULL THEN
    UPDATE public.game_access SET user_id = v_user_id WHERE id = v_row.id;
  END IF;

  RETURN jsonb_build_object('granted', true);
END;
$$;

REVOKE ALL ON FUNCTION public.game_access_check(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.game_access_check(TEXT, TEXT) TO anon, authenticated;
