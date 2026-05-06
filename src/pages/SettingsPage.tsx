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
  const [activeSection, setActiveSection] = useState<'organization' | 'profile' | 'danger'>('organization');

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
    <div className="space-y-6 max-w-5xl relative">
      <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-[720px] h-[210px] bg-indigo-500/[0.05] blur-[90px] rounded-full" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default">Settings</Badge>
            <Badge variant="default">Account</Badge>
          </div>
          <h1 className="text-2xl sm:text-[2rem] font-semibold text-white tracking-[-0.03em]">Workspace Settings</h1>
          <p className="text-slate-400 text-sm mt-1 font-light">Configure organization identity, personal profile, and sensitive actions.</p>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap gap-2">
        <button onClick={() => setActiveSection('organization')} className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${activeSection === 'organization' ? 'bg-blue-500/12 text-blue-200 border-blue-400/30' : 'bg-slate-900/55 text-slate-400 border-white/10 hover:text-slate-200 hover:border-slate-400/30'}`}>
          Organization
        </button>
        <button onClick={() => setActiveSection('profile')} className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${activeSection === 'profile' ? 'bg-blue-500/12 text-blue-200 border-blue-400/30' : 'bg-slate-900/55 text-slate-400 border-white/10 hover:text-slate-200 hover:border-slate-400/30'}`}>
          Profile
        </button>
        {isAdmin && (
          <button onClick={() => setActiveSection('danger')} className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${activeSection === 'danger' ? 'bg-red-500/12 text-red-300 border-red-400/30' : 'bg-slate-900/55 text-slate-400 border-white/10 hover:text-slate-200 hover:border-slate-400/30'}`}>
            Danger Zone
          </button>
        )}
      </div>

      {activeSection === 'organization' && (
        <Card className="animate-fade-in-up bg-slate-900/50 border-white/10 backdrop-blur-xl">
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
              hint="Displayed in workspace headers and member invites"
            />
            <Input
              id="org-id"
              label="Organization ID"
              value={currentOrg?.id || ''}
              disabled
              hint="Stable identifier used for integrations"
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
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={savingOrg} icon={<Save className="w-4 h-4" />}>
                  Save Organization
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {activeSection === 'profile' && (
        <Card className="animate-fade-in-up bg-slate-900/50 border-white/10 backdrop-blur-xl">
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
              hint="Shown in activity logs and member lists"
            />
            <Input
              id="email"
              label="Email"
              value={profile?.email || ''}
              disabled
              hint="Email is managed by your authentication provider"
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
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={savingProfile} icon={<Save className="w-4 h-4" />}>
                Save Profile
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isAdmin && activeSection === 'danger' && (
        <Card className="border-red-500/20 bg-red-500/[0.04] backdrop-blur-xl animate-fade-in-up">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <CardTitle className="text-red-300">Danger Zone</CardTitle>
            </div>
          </CardHeader>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Sensitive actions that can affect your workspace. Review carefully before proceeding.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/8 border border-red-500/20">
              <div>
                <p className="text-sm font-medium text-white">Delete Organization</p>
                <p className="text-xs text-slate-400 mt-0.5">Permanently delete this organization and all associated data.</p>
              </div>
              <Button variant="danger" size="sm" disabled>Delete</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
