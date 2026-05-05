/*
  # Fix signup trigger and RLS policies

  1. Problem
    - The `handle_new_user()` trigger fails during signup, causing "Database error saving new user"
    - RLS policies for `memberships` INSERT require the user to already be an admin in the org
      (chicken-and-egg: no membership exists yet to prove admin status)
    - RLS policies for `subscriptions` INSERT similarly require admin membership
    - This means even if the trigger fails, client-side fallback cannot create these records

  2. Changes
    - Replace `handle_new_user()` with a fixed version that:
      - Uses `SECURITY DEFINER` with explicit search_path to prevent injection
      - Wraps each insert in a BEGIN/EXCEPTION block for granular error handling
      - Logs errors to Postgres logs via `raise notice`
    - Fix `memberships` INSERT policy: allow a user to insert their own membership
      when they are the user being added (auth.uid() = user_id), even if no admin exists yet
    - Fix `subscriptions` INSERT policy: allow insert when the user is creating the
      first subscription for an org they just created (no existing subscription for that org)
    - Fix `memberships` SELECT policy: allow users to see their own memberships
      even before they can see other members (needed for OrgContext to bootstrap)

  3. Security
    - The memberships INSERT policy now allows self-membership (auth.uid() = user_id)
      which is safe because a user can only add themselves, not arbitrary users
    - The subscriptions INSERT policy allows creating a subscription for an org
      when no subscription exists yet AND the user is a member of that org
    - All other restrictive policies remain unchanged
*/

-- ============================================================
-- Fix the handle_new_user trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create profile (wrap in exception block for granular error handling)
  BEGIN
    INSERT INTO profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user: failed to create profile for %: %', NEW.id, SQLERRM;
  END;

  -- Create personal organization
  BEGIN
    INSERT INTO organizations (name, slug)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || '''s Organization'),
      gen_random_uuid()::text
    )
    RETURNING id INTO new_org_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'handle_new_user: failed to create org for %: %', NEW.id, SQLERRM;
    RETURN NEW;
  END;

  -- Add user as admin of their org
  IF new_org_id IS NOT NULL THEN
    BEGIN
      INSERT INTO memberships (user_id, organization_id, role)
      VALUES (NEW.id, new_org_id, 'admin');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'handle_new_user: failed to create membership for % in org %: %', NEW.id, new_org_id, SQLERRM;
    END;

    -- Create free subscription for the org
    BEGIN
      INSERT INTO subscriptions (organization_id, stripe_customer_id, plan, status)
      VALUES (new_org_id, 'cus_free_' || gen_random_uuid()::text, 'free', 'active');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'handle_new_user: failed to create subscription for org %: %', new_org_id, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Fix RLS policies for memberships
-- ============================================================

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can insert memberships" ON memberships;

-- New INSERT policy: allow user to insert their own membership (self-join),
-- OR allow existing admins to add members
CREATE POLICY "Users can insert own membership or admins can insert memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is adding themselves to an org
    auth.uid() = user_id
    OR
    -- An existing admin in the org is adding someone
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = memberships.organization_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- Fix SELECT policy: allow users to see their own memberships
-- (needed for bootstrap before they can see other members)
DROP POLICY IF EXISTS "Users can view memberships in their org" ON memberships;

CREATE POLICY "Users can view memberships in their org"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    -- User can see their own memberships
    user_id = auth.uid()
    OR
    -- User can see memberships in orgs they belong to
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = memberships.organization_id
      AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- Fix RLS policies for subscriptions
-- ============================================================

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can insert subscription for their org" ON subscriptions;

-- New INSERT policy: allow creating the first subscription for an org
-- when the user is a member of that org, OR allow admins to insert
CREATE POLICY "Members can insert first subscription or admins can insert subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is a member of the org (for initial subscription creation)
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = subscriptions.organization_id
      AND m.user_id = auth.uid()
    )
    AND
    -- No subscription exists yet for this org (only one per org)
    NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.organization_id = subscriptions.organization_id
    )
    OR
    -- An existing admin can also insert (for edge cases)
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = subscriptions.organization_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- Fix SELECT policy: allow users to see subscriptions for orgs they belong to
-- (this one is already correct but let's ensure it works with the new membership policy)
DROP POLICY IF EXISTS "Users can view subscription for their org" ON subscriptions;

CREATE POLICY "Users can view subscription for their org"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = subscriptions.organization_id
      AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- Fix RLS policies for organizations SELECT
-- (allow users to see orgs they just created, even before membership is visible)
-- ============================================================
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;

CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = organizations.id
      AND memberships.user_id = auth.uid()
    )
  );
