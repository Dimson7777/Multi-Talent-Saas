/*
  # Multi-Tenant SaaS Platform - Initial Schema

  1. New Tables
    - `organizations` - Tenant entities that group users and data
      - `id` (uuid, primary key)
      - `name` (text, organization display name)
      - `slug` (text, unique URL-friendly identifier)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `profiles` - Extended user data linked to auth.users
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `memberships` - Join table linking users to organizations with roles
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `organization_id` (uuid, references organizations)
      - `role` (text, 'admin' or 'member')
      - `joined_at` (timestamptz)

    - `invitations` - Pending invitations to join organizations
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `email` (text, invitee email)
      - `role` (text, role to assign)
      - `invited_by` (uuid, references profiles)
      - `token` (text, unique invitation token)
      - `accepted_at` (timestamptz, nullable)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

    - `subscriptions` - Stripe subscription data per organization
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `stripe_customer_id` (text)
      - `stripe_subscription_id` (text, nullable)
      - `plan` (text, 'free' or 'pro')
      - `status` (text, subscription status)
      - `current_period_end` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `activity_logs` - Audit trail of user actions
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `user_id` (uuid, references profiles)
      - `action` (text, action type)
      - `details` (jsonb, nullable)
      - `created_at` (timestamptz)

    - `notifications` - User notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `organization_id` (uuid, references organizations)
      - `type` (text, notification type)
      - `title` (text)
      - `message` (text)
      - `read` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on ALL tables
    - Policies restrict data access to authenticated users within their organization
    - Users can only see/modify data in organizations they belong to
    - Admin-only operations (invitations, billing) are restricted by role

  3. Important Notes
    - memberships has a unique constraint on (user_id, organization_id)
    - subscriptions has a unique constraint on organization_id (one sub per org)
    - invitations token is unique for secure lookup
    - All tables use gen_random_uuid() for primary keys
*/

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE (user_id, organization_id)
);

-- Invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  accepted_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Organizations policies
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

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = organizations.id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Memberships policies
CREATE POLICY "Users can view memberships in their org"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = memberships.organization_id
      AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = memberships.organization_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'admin'
    )
  );

CREATE POLICY "Admins can update memberships in their org"
  ON memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = memberships.organization_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = memberships.organization_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete memberships in their org"
  ON memberships FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.organization_id = memberships.organization_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- Invitations policies
CREATE POLICY "Users can view invitations in their org"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = invitations.organization_id
      AND memberships.user_id = auth.uid()
    )
    OR email = (SELECT p.email FROM profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = invitations.organization_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete invitations in their org"
  ON invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = invitations.organization_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'admin'
    )
  );

CREATE POLICY "Users can update invitations addressed to them"
  ON invitations FOR UPDATE
  TO authenticated
  USING (
    email = (SELECT p.email FROM profiles p WHERE p.id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT p.email FROM profiles p WHERE p.id = auth.uid())
  );

-- Subscriptions policies
CREATE POLICY "Users can view subscription for their org"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = subscriptions.organization_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update subscription for their org"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = subscriptions.organization_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = subscriptions.organization_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert subscription for their org"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = subscriptions.organization_id
      AND memberships.user_id = auth.uid()
      AND memberships.role = 'admin'
    )
  );

-- Activity logs policies
CREATE POLICY "Users can view activity logs in their org"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = activity_logs.organization_id
      AND memberships.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity logs in their org"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.organization_id = activity_logs.organization_id
      AND memberships.user_id = auth.uid()
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert notifications for themselves"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
  new_sub_id uuid;
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Create a personal organization for the user
  INSERT INTO organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || '''s Organization'),
    gen_random_uuid()::text
  )
  RETURNING id INTO new_org_id;

  -- Add user as admin of their org
  INSERT INTO memberships (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'admin');

  -- Create free subscription for the org
  INSERT INTO subscriptions (organization_id, stripe_customer_id, plan, status)
  VALUES (new_org_id, 'cus_free_' || gen_random_uuid()::text, 'free', 'active');

  RETURN NEW;
END;
$$;

-- Trigger to call handle_new_user on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
