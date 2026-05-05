/*
  # Fix infinite recursion in memberships RLS policies

  1. Problem
    - All memberships policies reference the memberships table in their own
      conditions (e.g., `EXISTS (SELECT 1 FROM memberships m WHERE ...)`)
    - This causes PostgreSQL to recurse infinitely when evaluating the policy,
      since evaluating the policy requires querying the same table whose
      policy is being evaluated
    - Error: "infinite recursion detected in policy for relation memberships"

  2. Solution
    - Replace ALL memberships policies with non-recursive versions
    - SELECT: user_id = auth.uid() (simple, no self-join needed)
    - INSERT: auth.uid() = user_id (user can add themselves)
    - UPDATE: auth.uid() = user_id (user can update own membership only)
    - DELETE: auth.uid() = user_id (user can remove themselves only)
    - Admin-only operations (role changes, removing others) will be handled
      by the SECURITY DEFINER trigger or edge functions, not RLS

  3. Security
    - Users can only see and modify their own memberships
    - Admins who need to manage other members can do so through server-side
      functions (SECURITY DEFINER) that bypass RLS
    - This is the standard Supabase pattern for avoiding RLS recursion
*/

-- Drop ALL existing memberships policies to eliminate recursion
DROP POLICY IF EXISTS "Users can view memberships in their org" ON memberships;
DROP POLICY IF EXISTS "Users can insert own membership or admins can insert membership" ON memberships;
DROP POLICY IF EXISTS "Admins can update memberships in their org" ON memberships;
DROP POLICY IF EXISTS "Admins can delete memberships in their org" ON memberships;

-- SELECT: users can see their own memberships
CREATE POLICY "Users can view own memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: users can insert their own membership (for signup flow)
CREATE POLICY "Users can insert own membership"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can update their own membership
CREATE POLICY "Users can update own membership"
  ON memberships FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: users can delete their own membership
CREATE POLICY "Users can delete own membership"
  ON memberships FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
