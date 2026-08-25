-- =============================================================================
-- XoXo Shop - Supabase RLS audit & hardening
-- =============================================================================
-- WHY THIS FILE EXISTS
--
-- The wallet feature runs entirely in the browser against Supabase using the
-- public anon key (see frontend/src/lib/api/endpoints.ts: wallet_deposits,
-- wallet_transactions, profiles, uid_checker_configs, and the RPCs
-- approve_wallet_deposit / reject_wallet_deposit / pay_order_with_wallet).
--
-- The anon key is published in the browser bundle - that is normal and expected.
-- What it means is that ANY visitor can send the same requests the app sends,
-- with any parameters they like. So for these tables the only thing standing
-- between a customer and "approve my own 50,000 BDT deposit" is Row Level
-- Security plus the checks inside those functions. None of that lives in this
-- repo, so it could not be reviewed here.
--
-- HOW TO USE
--   1. Run PART 1 in the Supabase SQL editor and read the output.
--   2. Only apply the PART 2 statements that match your actual schema.
--      Adjust column names first - they are written from the frontend's usage.
--   3. Re-run PART 1 to confirm.
-- =============================================================================


-- =============================================================================
-- PART 1 - AUDIT (read-only, safe to run as-is)
-- =============================================================================

-- 1a. Which tables are exposed without RLS? Anything 'false' here is readable and
--     possibly writable by anyone holding the anon key.
SELECT schemaname, tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

-- 1b. What policies exist, and what do they actually allow?
SELECT tablename, policyname, cmd, roles, qual AS using_expression, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 1c. Which functions run with the definer's rights? These bypass RLS, so each one
--     must check the caller's role itself.
SELECT n.nspname AS schema,
       p.proname AS function,
       CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security,
       pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY p.prosecdef DESC, p.proname;

-- 1d. Who may execute the money-moving RPCs? 'authenticated' having EXECUTE on
--     approve_wallet_deposit means any signed-in customer can call it directly.
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name IN (
    'approve_wallet_deposit',
    'reject_wallet_deposit',
    'pay_order_with_wallet'
  )
ORDER BY routine_name, grantee;

-- 1e. Read the body of each RPC and confirm it verifies the caller is an admin
--     before changing balances.
SELECT p.proname, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('approve_wallet_deposit', 'reject_wallet_deposit', 'pay_order_with_wallet');


-- =============================================================================
-- PART 2 - HARDENING (review before running; adjust column names to your schema)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2a. uid_checker_configs holds provider API keys. It is read by our server route
--     only, so the browser must not be able to read it at all.
-- -----------------------------------------------------------------------------
ALTER TABLE public.uid_checker_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uid_configs_no_public_access" ON public.uid_checker_configs;
CREATE POLICY "uid_configs_no_public_access"
  ON public.uid_checker_configs
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
-- NOTE: with this in place the /api/uid-checker route needs the service role key
-- (server-side only, never NEXT_PUBLIC_*) to read configs, or it falls back to
-- GAMESKINBO_API_KEY from the environment, which is also fine.


-- -----------------------------------------------------------------------------
-- 2b. profiles - a customer may read and update only their own row, and must not
--     be able to change their own roles or status.
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid()::text);


-- -----------------------------------------------------------------------------
-- 2c. wallet_deposits - a customer may see their own deposits and file a new
--     PENDING one. Status changes belong to the approval RPC, never to the client.
-- -----------------------------------------------------------------------------
ALTER TABLE public.wallet_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deposits_select_own" ON public.wallet_deposits;
CREATE POLICY "deposits_select_own"
  ON public.wallet_deposits
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text)
  );

DROP POLICY IF EXISTS "deposits_insert_own_pending" ON public.wallet_deposits;
CREATE POLICY "deposits_insert_own_pending"
  ON public.wallet_deposits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text)
    AND status = 'PENDING'
    AND amount > 0
  );

-- Deliberately no UPDATE/DELETE policy: with RLS on, that means nobody but the
-- service role and SECURITY DEFINER functions can change a deposit.


-- -----------------------------------------------------------------------------
-- 2d. wallet_transactions - read-only ledger for the owner.
-- -----------------------------------------------------------------------------
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.wallet_transactions;
CREATE POLICY "transactions_select_own"
  ON public.wallet_transactions
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()::text)
  );


-- -----------------------------------------------------------------------------
-- 2e. The money-moving RPCs must not be callable by ordinary customers.
--     Either revoke EXECUTE (and call them from the backend with the service role
--     key), or keep the grant and enforce the admin check inside the function.
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.approve_wallet_deposit(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reject_wallet_deposit(uuid, text) FROM anon, authenticated;

-- If you keep them callable from the admin UI, every such function needs a guard
-- along these lines as its first statement:
--
--   IF NOT EXISTS (
--     SELECT 1
--     FROM public.user_roles ur
--     JOIN public.profiles p ON p.id = ur.user_id
--     WHERE p.auth_user_id = auth.uid()::text
--       AND ur.role_code IN ('ADMIN', 'SUPER_ADMIN')
--   ) THEN
--     RAISE EXCEPTION 'not authorised';
--   END IF;
--
-- pay_order_with_wallet needs the matching check that the order belongs to
-- auth.uid() and that the wallet balance is debited in the same transaction.
