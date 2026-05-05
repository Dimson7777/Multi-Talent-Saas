import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';

export function useActivityLog() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();

  const logActivity = useCallback(
    async (action: string, details?: Record<string, unknown>) => {
      if (!user || !currentOrg) return;

      await supabase.from('activity_logs').insert({
        organization_id: currentOrg.id,
        user_id: user.id,
        action,
        details: details || null,
      });
    },
    [user, currentOrg]
  );

  return { logActivity };
}
