
CREATE POLICY "owner or admin read marketing media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'marketing-media' AND (public.has_role(auth.uid(),'admin') OR (storage.foldername(name))[1] = auth.uid()::text));
CREATE POLICY "owner insert marketing media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'marketing-media' AND (public.has_role(auth.uid(),'admin') OR (storage.foldername(name))[1] = auth.uid()::text));
CREATE POLICY "owner update marketing media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'marketing-media' AND (public.has_role(auth.uid(),'admin') OR (storage.foldername(name))[1] = auth.uid()::text));
CREATE POLICY "owner delete marketing media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'marketing-media' AND (public.has_role(auth.uid(),'admin') OR (storage.foldername(name))[1] = auth.uid()::text));
