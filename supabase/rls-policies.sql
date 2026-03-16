-- ─────────────────────────────────────────────────────────────────────────────
-- Clearpath — Row Level Security Policies
-- Run this against your Supabase project whenever the database is reset.
--
-- Analytics queries (UserProfile, UserEngagement aggregates) must run from a
-- server-side context using the service role key, which bypasses RLS.
-- NEVER expose the service role key to the browser.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_engagement      ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_plans      ENABLE ROW LEVEL SECURITY;


-- ── users ─────────────────────────────────────────────────────────────────────

CREATE POLICY "users: select own row"
  ON users FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "users: insert own row"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "users: update own row"
  ON users FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "users: delete own row"
  ON users FOR DELETE
  USING (id = auth.uid()::text);


-- ── user_profiles ─────────────────────────────────────────────────────────────

CREATE POLICY "user_profiles: select own row"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "user_profiles: insert own row"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_profiles: update own row"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_profiles: delete own row"
  ON user_profiles FOR DELETE
  USING (user_id = auth.uid()::text);


-- ── user_engagement ───────────────────────────────────────────────────────────

CREATE POLICY "user_engagement: select own row"
  ON user_engagement FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "user_engagement: insert own row"
  ON user_engagement FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_engagement: update own row"
  ON user_engagement FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "user_engagement: delete own row"
  ON user_engagement FOR DELETE
  USING (user_id = auth.uid()::text);


-- ── financial_plans ───────────────────────────────────────────────────────────

CREATE POLICY "financial_plans: select own rows"
  ON financial_plans FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "financial_plans: insert own rows"
  ON financial_plans FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "financial_plans: update own rows"
  ON financial_plans FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "financial_plans: delete own rows"
  ON financial_plans FOR DELETE
  USING (user_id = auth.uid()::text);
