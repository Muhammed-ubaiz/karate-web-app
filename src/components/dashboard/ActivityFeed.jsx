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
  Building,
  Trash2
} from 'lucide-react';

const ICON_MAP = {
  CheckCircle: CheckCircle2,
  CreditCard: CreditCard,
  UserPlus: UserPlus,
  MessageSquare: MessageSquare,
  Award: Award,
  Calendar: Calendar,
  Building: Building,
  Activity: Activity,
  Trash2: Trash2
};

export const ActivityFeed = () => {
  const { activities, clearActivities } = useDojo();

  return (
    <div className="bg-dojo-card border border-dojo-border rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-dojo-red" />
          <h3 className="text-sm font-bold text-white tracking-tight">Recent Dojo Activity</h3>
        </div>

        <div className="flex items-center gap-2">
          {activities.length > 0 && (
            <button
              type="button"
              onClick={clearActivities}
              className="text-[11px] font-semibold text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear activity log"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700/60">
            Live Feed
          </span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-500">
            <Activity className="w-5 h-5 stroke-[1.5]" />
          </div>
          <p className="text-xs font-semibold text-zinc-400">No activity logged yet</p>
          <p className="text-[11px] text-zinc-600">New enrollments, fee records, and attendance updates will appear here live.</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};
