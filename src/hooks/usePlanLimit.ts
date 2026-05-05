import { useOrg } from '../contexts/OrgContext';

type PlanLimit = {
  canAddMember: (currentCount: number) => boolean;
  maxMembers: number | null;
  isPro: boolean;
  canAccess: (feature: string) => boolean;
};

const proFeatures = new Set([
  'advanced_analytics',
  'unlimited_members',
  'priority_support',
  'custom_integrations',
  'audit_trail',
  'export_data',
]);

export function usePlanLimit(): PlanLimit {
  const { isPro } = useOrg();

  return {
    canAddMember: (currentCount: number) => isPro || currentCount < 5,
    maxMembers: isPro ? null : 5,
    isPro,
    canAccess: (feature: string) => !proFeatures.has(feature) || isPro,
  };
}
