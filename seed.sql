-- =====================================================================
-- PAVO CLUB — seed.sql   (run FOURTH)
-- Creates ONLY the single club_settings row (no players, matches or news).
-- Every value except the club name "PAVO CLUB" is left empty on purpose:
-- fill the rest from Admin > Club identity and Admin > Settings.
-- =====================================================================

insert into public.club_settings (id) values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- FIRST ADMIN  (do this by hand, once)
-- 1. Supabase Dashboard > Authentication > Users > "Add user"
--    (tick "Auto confirm user"), using your real e-mail and a strong password.
-- 2. Replace the e-mail below with that user's e-mail and run ONLY this statement:
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com';
--
-- Also disable public sign-ups: Authentication > Providers > Email >
-- turn OFF "Allow new users to sign up". Even if left on, a new account has
-- no row in user_roles and therefore no write access anywhere.
-- ---------------------------------------------------------------------
