import { useEffect, useState, type FormEvent } from 'react';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Card, CardHeader, CardTitle, Button, Badge, Modal, Input, Select, UpgradePrompt } from '../components/ui';
import type { Membership, Invitation } from '../types';
import { UserPlus, Users, Mail, Shield, Trash2, MoreHorizontal, Clock, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function TeamSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-24 bg-slate-800/40 rounded-lg animate-shimmer" />
          <div className="h-4 w-56 bg-slate-800/30 rounded mt-2 animate-shimmer" />
        </div>
      </div>
      <div className="h-64 bg-slate-900/50 rounded-xl animate-shimmer border border-slate-800/30" />
    </div>
  );
}

export default function TeamPage() {
  const { currentOrg, currentRole, isPro, refreshOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isAdmin = currentRole === 'admin';

  useEffect(() => {
    if (!currentOrg) return;
    fetchTeamData();
  }, [currentOrg]);

  const fetchTeamData = async () => {
    if (!currentOrg) return;
    setLoading(true);
    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from('memberships')
        .select('*, profiles(*)')
        .eq('organization_id', currentOrg.id)
        .order('joined_at', { ascending: true }),
      supabase
        .from('invitations')
        .select('*, profiles(*)')
        .eq('organization_id', currentOrg.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString()),
    ]);
    setMembers(membersRes.data || []);
    setInvitations(invitesRes.data || []);
    setLoading(false);
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !user) return;

    if (!isPro && members.length >= 5) {
      setInviteError('Free plan is limited to 5 members. Upgrade to Pro for unlimited members.');
      return;
    }

    setInviteLoading(true);
    setInviteError('');

    try {
      const { error } = await supabase.from('invitations').insert({
        organization_id: currentOrg.id,
        email: inviteEmail,
        role: inviteRole,
        invited_by: user.id,
      });

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        organization_id: currentOrg.id,
        user_id: user.id,
        action: 'member_invited',
        details: { email: inviteEmail, role: inviteRole },
      });

      toast('success', 'Invitation sent', `An invitation has been sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('member');
      setInviteModalOpen(false);
      fetchTeamData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send invitation';
      setInviteError(msg);
      toast('error', 'Invitation failed', msg);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    if (!currentOrg || !user) return;

    const { error } = await supabase
      .from('memberships')
      .update({ role: newRole })
      .eq('id', membershipId);

    if (!error) {
      await supabase.from('activity_logs').insert({
        organization_id: currentOrg.id,
        user_id: user.id,
        action: 'member_role_changed',
        details: { membership_id: membershipId, new_role: newRole },
      });
      toast('success', 'Role updated', `Member role changed to ${newRole}`);
      fetchTeamData();
    } else {
      toast('error', 'Update failed', 'Failed to change member role');
    }
    setActionMenuId(null);
  };

  const handleRemoveMember = async (membershipId: string) => {
    if (!currentOrg || !user) return;
    setRemovingId(membershipId);

    const { error } = await supabase.from('memberships').delete().eq('id', membershipId);

    if (!error) {
      await supabase.from('activity_logs').insert({
        organization_id: currentOrg.id,
        user_id: user.id,
        action: 'member_removed',
        details: { membership_id: membershipId },
      });
      toast('success', 'Member removed', 'The member has been removed from the team');
      fetchTeamData();
      refreshOrg();
    } else {
      toast('error', 'Removal failed', 'Failed to remove member');
    }
    setRemovingId(null);
    setActionMenuId(null);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    await supabase.from('invitations').delete().eq('id', invitationId);
    toast('info', 'Invitation canceled', 'The pending invitation has been canceled');
    fetchTeamData();
  };

  if (loading) return <TeamSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Team</h1>
          <p className="text-slate-500 text-sm mt-1">Manage members and invitations</p>
        </div>
        {isAdmin && (
          <Button
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              setInviteModalOpen(true);
              setInviteError('');
            }}
          >
            Invite Member
          </Button>
        )}
      </div>

      {!isPro && members.length >= 4 && isAdmin && (
        <UpgradePrompt
          feature="unlimited team members"
          description={`Free plan is limited to 5 members. You have ${members.length}/5. Upgrade to Pro for unlimited members.`}
        />
      )}

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <Badge variant="warning" dot>{invitations.length}</Badge>
          </CardHeader>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/20 border border-slate-800/30 animate-fade-in-up">
                <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/20">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{inv.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={inv.role === 'admin' ? 'info' : 'default'}>{inv.role}</Badge>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires {formatDistanceToNow(new Date(inv.expires_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleCancelInvitation(inv.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    title="Cancel invitation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding={false}>
        <div className="px-6 py-4 border-b border-slate-800/40">
          <div className="flex items-center justify-between">
            <CardTitle>Members</CardTitle>
            <Badge variant="default">{members.length} {isPro ? '' : '/ 5'}</Badge>
          </div>
        </div>
        {members.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-float" />
            <p className="text-sm font-medium text-slate-400">No team members</p>
            <p className="text-xs text-slate-600 mt-0.5">Invite members to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/30">
            {members.map((m, i) => {
              const p = m.profiles as unknown as { full_name: string; email: string };
              const isSelf = m.user_id === user?.id;
              const initials = p?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';
              const isRemoving = removingId === m.id;

              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 px-6 py-4 hover:bg-slate-800/15 transition-all duration-200 animate-fade-in-up ${isRemoving ? 'opacity-40 pointer-events-none' : ''}`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-semibold text-slate-300 border border-slate-700/40 shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{p?.full_name || 'Unknown'}</p>
                      {isSelf && <Badge variant="info">You</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{p?.email}</p>
                  </div>
                  <Badge variant={m.role === 'admin' ? 'info' : 'default'}>{m.role}</Badge>

                  {isAdmin && !isSelf && (
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === m.id ? null : m.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800/60 transition-all duration-200"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {actionMenuId === m.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 glass-strong rounded-xl shadow-2xl shadow-black/40 py-1 z-10 animate-fade-in-down">
                          {m.role !== 'admin' && (
                            <button
                              onClick={() => handleRoleChange(m.id, 'admin')}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/60 transition-colors"
                            >
                              <Shield className="w-4 h-4 text-blue-400" />
                              Make Admin
                            </button>
                          )}
                          {m.role === 'admin' && (
                            <button
                              onClick={() => handleRoleChange(m.id, 'member')}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/60 transition-colors"
                            >
                              <Users className="w-4 h-4 text-slate-400" />
                              Make Member
                            </button>
                          )}
                          <div className="my-1 border-t border-slate-800/40" />
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove Member
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteError('');
        }}
        title="Invite Team Member"
        description="Send an invitation to join your organization"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteError && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/15">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-400">{inviteError}</p>
            </div>
          )}
          <Input
            id="invite-email"
            label="Email address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
          />
          <Select
            id="invite-role"
            label="Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            options={[
              { value: 'member', label: 'Member - Can view and use features' },
              { value: 'admin', label: 'Admin - Can manage team and billing' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/40">
            <Button variant="secondary" type="button" onClick={() => { setInviteModalOpen(false); setInviteError(''); }}>
              Cancel
            </Button>
            <Button type="submit" loading={inviteLoading}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
