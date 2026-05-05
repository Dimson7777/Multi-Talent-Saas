import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';

export function useNotifications() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();

  const sendNotification = useCallback(
    async (userId: string, type: string, title: string, message: string) => {
      if (!user || !currentOrg) return;

      await supabase.from('notifications').insert({
        user_id: userId,
        organization_id: currentOrg.id,
        type,
        title,
        message,
      });
    },
    [user, currentOrg]
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user || !currentOrg) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('organization_id', currentOrg.id)
      .eq('read', false);
  }, [user, currentOrg]);

  return { sendNotification, markAsRead, markAllAsRead };
}
