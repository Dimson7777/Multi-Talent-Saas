import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  delay?: number;
}

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut', delay },
  }),
};

export default function StatCard({ label, value, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      variants={fadeInUpVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      className="h-[112px] rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-3.5"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <div className="w-8 h-8 rounded-xl bg-slate-800/70 border border-white/10 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-[1.4rem] leading-none font-semibold tracking-[-0.03em] text-slate-100 mt-3">{value}</p>
    </motion.div>
  );
}