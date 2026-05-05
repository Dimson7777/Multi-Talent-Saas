import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Organization, Membership, Subscription } from '../types';

type OrgContextType = {
  organizations: Membership[];
  currentOrg: Organization | null;
  currentRole: 'admin' | 'member' | null;
  subscription: Subscription | null;
  isPro: boolean;
  loading: boolean;
  switchOrg: (orgId: string) => void;
  refreshOrg: () => Promise<void>;
  refreshSubscription: () => Promise<Subscription | null>;
};

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Membership[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentRole, setCurrentRole] = useState<'admin' | 'member' | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchSubscription = useCallback(async (orgId: string): Promise<Subscription | null> => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();
    if (error) {
      console.error('Failed to fetch subscription:', error.message);
      return null;
    }
    setSubscription(data ?? null);
    return data ?? null;
  }, []);

  const fetchOrgData = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setCurrentRole(null);
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: memberships, error } = await supabase
      .from('memberships')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch memberships:', error.message);
      setLoading(false);
      return;
    }

    if (memberships && memberships.length > 0) {
      setOrganizations(memberships as Membership[]);

      const storedOrgId = localStorage.getItem('currentOrgId');
      const targetMembership = storedOrgId
        ? memberships.find((m) => m.organization_id === storedOrgId) || memberships[0]
        : memberships[0];

      if (targetMembership?.organizations) {
        const org = targetMembership.organizations as unknown as Organization;
        setCurrentOrg(org);
        setCurrentRole(targetMembership.role);
        localStorage.setItem('currentOrgId', org.id);
        await fetchSubscription(org.id);
      }
    } else {
      setOrganizations([]);
      setCurrentOrg(null);
      setCurrentRole(null);
      setSubscription(null);
    }
    setLoading(false);
  }, [user, fetchSubscription]);

  // Initial fetch
  useEffect(() => {
    fetchOrgData();
  }, [fetchOrgData]);

  // Real-time subscription listener
  useEffect(() => {
    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!currentOrg) return;

    const channel = supabase
      .channel(`sub-${currentOrg.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `organization_id=eq.${currentOrg.id}`,
        },
        (payload) => {
          const newSub = payload.new as Subscription;
          setSubscription(newSub);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscriptions',
          filter: `organization_id=eq.${currentOrg.id}`,
        },
        (payload) => {
          const newSub = payload.new as Subscription;
          setSubscription(newSub);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentOrg?.id]);

  const switchOrg = useCallback((orgId: string) => {
    const membership = organizations.find((m) => m.organization_id === orgId);
    if (membership?.organizations) {
      const org = membership.organizations as unknown as Organization;
      setCurrentOrg(org);
      setCurrentRole(membership.role);
      localStorage.setItem('currentOrgId', org.id);
      fetchSubscription(org.id);
    }
  }, [organizations, fetchSubscription]);

  const refreshSubscription = useCallback(async (): Promise<Subscription | null> => {
    if (currentOrg) {
      return fetchSubscription(currentOrg.id);
    }
    return null;
  }, [currentOrg, fetchSubscription]);

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        currentRole,
        subscription,
        isPro: subscription?.plan === 'pro' && (subscription?.status === 'active' || subscription?.status === 'trialing'),
        loading,
        switchOrg,
        refreshOrg: fetchOrgData,
        refreshSubscription,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) throw new Error('useOrg must be used within OrgProvider');
  return context;
}
