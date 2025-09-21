-- Manually create the missing admin profile
INSERT INTO public.profiles (user_id, username, full_name, role)
VALUES (
  '8cdb0d12-d1c6-4cb2-a94c-d44de417f712',
  'admin',
  'Admin User',
  'admin'
) ON CONFLICT (user_id) DO NOTHING;