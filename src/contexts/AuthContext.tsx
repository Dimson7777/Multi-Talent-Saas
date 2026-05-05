import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import type { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, orgName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('Failed to fetch profile:', error.message);
      return;
    }
    setProfile(data);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
        // Only set loading=false on non-initial events
        if (event !== 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, fullName: string, orgName: string) => {
    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, org_name: orgName },
      },
    });
    if (error) throw new Error(`Auth signup failed: ${error.message}`);
    if (!data.user) throw new Error('Signup failed: no user returned');

    const userId = data.user.id;

    // Step 2: Verify trigger created profile, fallback if not
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileErr } = await supabase.from('profiles').insert({
        id: userId,
        email,
        full_name: fullName,
      });
      if (profileErr) throw new Error(`Failed to create profile: ${profileErr.message}`);
    }

    // Step 3: Verify trigger created membership/org, fallback if not
    const { data: existingMemberships } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', userId);

    if (!existingMemberships || existingMemberships.length === 0) {
      // Create organization
      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: orgName, slug: crypto.randomUUID() })
        .select('id')
        .single();

      if (orgErr || !org) throw new Error(`Failed to create organization: ${orgErr?.message || 'Unknown error'}`);

      // Create membership as admin
      const { error: memErr } = await supabase.from('memberships').insert({
        user_id: userId,
        organization_id: org.id,
        role: 'admin',
      });
      if (memErr) throw new Error(`Failed to create membership: ${memErr.message}`);

      // Create free subscription
      const { error: subErr } = await supabase.from('subscriptions').insert({
        organization_id: org.id,
        stripe_customer_id: `cus_free_${crypto.randomUUID()}`,
        plan: 'free',
        status: 'active',
      });
      if (subErr) throw new Error(`Failed to create subscription: ${subErr.message}`);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
