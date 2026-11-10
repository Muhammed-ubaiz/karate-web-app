import React from 'react';
import { useDojo, formatActivityTimeDisplay } from '../../context/DojoContext';
import { showConfirmDialog } from '../../utils/sweetAlert';
import {
  CheckCircle2,
  CreditCard,
  UserPlus,
  MessageSquare,
  Award,
  Activity,
  Calendar,
  Building,
  Trash2,
  Pencil,
  RotateCcw,
  RefreshCw,
  Clock,
  UserCheck,
  UserMinus,
  Receipt,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

const ICON_MAP = {
  CheckCircle: CheckCircle2,
  CreditCard,
  UserPlus,
  MessageSquare,
  Award,
  Calendar,
  Building,
  Activity,
  Trash2,
  Pencil,
  RotateCcw,
  RefreshCw,
  Clock,
  UserCheck,
  UserMinus,
  Receipt,
  ShieldAlert
};

export const ActivityFeed = () => {
  const {
    activities,
    clearActivities,
    requireAdmin,
    setActiveTab,
    setActiveFeesSubTab,
    paymentAuditLogs = []
  } = useDojo();

  const handleClearFeed = () => {
    requireAdmin(async () => {
      const confirmed = await showConfirmDialog({
        title: 'Clear Dashboard Feed?',
        text: 'This clears the recent activity feed on the Dashboard. Permanent Payment Audit Logs (edits, resets, and deletions) remain preserved under Fees & Billing → Activity & Audit Log.',
        confirmText: 'Yes, Clear Feed',
        icon: 'warning'
      });
      if (confirmed) {
        clearActivities();
      }
    }, 'Authorized staff verification required to clear the dashboard activity feed.');
  };

  const recentActivities = activities.slice(0, 15);

  return (
    <div className="bg-dojo-card border border-dojo-border rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-dojo-red" />
          <h3 className="text-sm font-bold text-white tracking-tight">Recent Dojo Activity</h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('fees');
              setActiveFeesSubTab('logs');
            }}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
            title="View full permanent payment activity, correction, reset & deletion log"
          >
            <span>Payment Audit Log ({paymentAuditLogs.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {activities.length > 0 && (
            <button
              type="button"
              onClick={handleClearFeed}
              className="text-[11px] font-semibold text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear dashboard activity feed (Staff Only)"
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

      {recentActivities.length === 0 ? (
        <div className="py-8 text-center text-zinc-500 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-500">
            <Activity className="w-5 h-5 stroke-[1.5]" />
          </div>
          <p className="text-xs font-semibold text-zinc-400">No activity logged yet</p>
          <p className="text-[11px] text-zinc-600">New enrollments, fee records, corrections, and attendance updates will appear here live.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {recentActivities.map((item, index) => {
            const Icon = ICON_MAP[item.icon] || Activity;
            const timeLabel = item.createdAtIso
              ? formatActivityTimeDisplay(item.createdAtIso)
              : item.timestamp;

            return (
              <div key={item.id || index} className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-zinc-800/90 border border-zinc-700/70 flex items-center justify-center shrink-0 group-hover:border-zinc-500 transition-colors">
                  <Icon className={`w-4 h-4 ${item.badgeColor || 'text-zinc-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-200 leading-snug group-hover:text-white transition-colors">
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-zinc-500 font-normal">
                      {timeLabel}
                    </span>
                    {item.billNumber && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {item.billNumber}
                      </span>
                    )}
                    {item.performedBy && (
                      <span className="text-[10px] text-zinc-500">
                        by {item.performedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
