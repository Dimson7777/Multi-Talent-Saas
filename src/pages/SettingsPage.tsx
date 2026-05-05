import { useState, type FormEvent } from 'react';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Card, CardHeader, CardTitle, Button, Input, Badge } from '../components/ui';
import { Building2, User, Save, AlertTriangle, Check } from 'lucide-react';

export default function SettingsPage() {
  const { currentOrg, currentRole, refreshOrg } = useOrg();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isAdmin = currentRole === 'admin';

  const [orgName, setOrgName] = useState(currentOrg?.name || '');
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgStatus, setOrgStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSaveOrg = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !isAdmin) return;
    setSavingOrg(true);
    setOrgStatus('idle');

    const { error } = await supabase
      .from('organizations')
      .update({ name: orgName })
      .eq('id', currentOrg.id);

    if (!error) {
      setOrgStatus('success');
      refreshOrg();
      toast('success', 'Organization updated', 'The organization name has been saved.');
    } else {
      setOrgStatus('error');
      toast('error', 'Update failed', 'Failed to update organization name.');
    }
    setSavingOrg(false);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileStatus('idle');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (!error) {
      setProfileStatus('success');
      toast('success', 'Profile updated', 'Your profile has been saved.');
    } else {
      setProfileStatus('error');
      toast('error', 'Update failed', 'Failed to update your profile.');
    }
    setSavingProfile(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your organization and profile</p>
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-slate-500" />
            <CardTitle>Organization</CardTitle>
          </div>
          {!isAdmin && <Badge variant="warning">Admin only</Badge>}
        </CardHeader>

        <form onSubmit={handleSaveOrg} className="space-y-4">
          <Input
            id="org-name"
            label="Organization Name"
            value={orgName}
            onChange={(e) => { setOrgName(e.target.value); setOrgStatus('idle'); }}
            disabled={!isAdmin}
          />
          <Input
            id="org-id"
            label="Organization ID"
            value={currentOrg?.id || ''}
            disabled
            hint="This is your unique organization identifier"
          />
          {orgStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 animate-fade-in">
              <Check className="w-4 h-4" />
              Organization name updated
            </div>
          )}
          {orgStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-400 animate-fade-in">
              <AlertTriangle className="w-4 h-4" />
              Failed to update organization name
            </div>
          )}
          {isAdmin && (
            <Button type="submit" loading={savingOrg} icon={<Save className="w-4 h-4" />}>
              Save Organization
            </Button>
          )}
        </form>
      </Card>

      <Card className="animate-fade-in-up stagger-2">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-slate-500" />
            <CardTitle>Profile</CardTitle>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            id="full-name"
            label="Full Name"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setProfileStatus('idle'); }}
          />
          <Input
            id="email"
            label="Email"
            value={profile?.email || ''}
            disabled
            hint="Email cannot be changed here"
          />
          {profileStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 animate-fade-in">
              <Check className="w-4 h-4" />
              Profile updated
            </div>
          )}
          {profileStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-400 animate-fade-in">
              <AlertTriangle className="w-4 h-4" />
              Failed to update profile
            </div>
          )}
          <Button type="submit" loading={savingProfile} icon={<Save className="w-4 h-4" />}>
            Save Profile
          </Button>
        </form>
      </Card>

      {isAdmin && (
        <Card className="border-red-500/15 animate-fade-in-up stagger-3">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
            </div>
          </CardHeader>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            These actions are irreversible. Please proceed with caution.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/10">
              <div>
                <p className="text-sm font-medium text-white">Delete Organization</p>
                <p className="text-xs text-slate-500 mt-0.5">Permanently delete this organization and all associated data</p>
              </div>
              <Button variant="danger" size="sm" disabled>Delete</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
