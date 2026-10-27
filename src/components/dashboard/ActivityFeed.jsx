import React from 'react';
import { useDojo } from '../../context/DojoContext';
import {
  CheckCircle2,
  CreditCard,
  UserPlus,
  MessageSquare,
  Award,
  Activity,
  Calendar,
  Building
} from 'lucide-react';

const ICON_MAP = {
  CheckCircle: CheckCircle2,
  CreditCard: CreditCard,
  UserPlus: UserPlus,
  MessageSquare: MessageSquare,
  Award: Award,
  Calendar: Calendar,
  Building: Building,
  Activity: Activity
};

export const ActivityFeed = () => {
  const { activities } = useDojo();

  return (
    <div className="bg-dojo-card border border-dojo-border rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-dojo-red" />
          <h3 className="text-sm font-bold text-white tracking-tight">Recent Dojo Activity</h3>
        </div>
        <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/60">
          Live Feed
        </span>
      </div>

      <div className="space-y-3.5">
        {activities.map((item, index) => {
          const Icon = ICON_MAP[item.icon] || Activity;

          return (
            <div key={item.id || index} className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-zinc-800/90 border border-zinc-700/70 flex items-center justify-center shrink-0 group-hover:border-zinc-500 transition-colors">
                <Icon className={`w-4 h-4 ${item.badgeColor || 'text-zinc-300'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-200 leading-snug group-hover:text-white transition-colors">
                  {item.text}
                </p>
                <span className="text-[10px] text-zinc-500 mt-0.5 block font-normal">
                  {item.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
