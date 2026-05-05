import { Sparkles, ArrowRight } from 'lucide-react';
import Button from './Button';
import { useNavigate } from 'react-router-dom';

type UpgradePromptProps = {
  feature: string;
  description?: string;
};

export default function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-600/8 via-blue-500/4 to-cyan-500/4 p-5 animate-border-glow">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="relative flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/15 shrink-0 animate-float">
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white mb-1">
            Unlock {feature} with Pro
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {description || `Upgrade to Pro to access ${feature} and other advanced features for your team.`}
          </p>
          <div className="mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/billing')}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
