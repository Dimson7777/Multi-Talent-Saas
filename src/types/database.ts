export type Organization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Membership = {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profiles?: Profile;
  organizations?: Organization;
};

export type Invitation = {
  id: string;
  organization_id: string;
  email: string;
  role: 'admin' | 'member';
  invited_by: string;
  token: string;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
  organizations?: Organization;
  profiles?: Profile;
};

export type Subscription = {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pro';
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityLog = {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  profiles?: Profile;
};

export type Notification = {
  id: string;
  user_id: string;
  organization_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type OrgMembership = Membership & {
  organizations: Organization;
};

export type OrgSubscription = Subscription & {
  organizations: Organization;
};
