import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, isAlert, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-dojo-card border transition-all duration-200 ${
        isAlert
          ? 'border-red-500/40 bg-gradient-to-b from-red-950/20 to-dojo-card shadow-lg shadow-red-950/30'
          : 'border-dojo-border hover:border-zinc-700/80 hover:bg-dojo-cardHover'
      } ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
            {trend && (
              <span className={`inline-flex items-center text-xs font-bold ${
                trend.positive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {trend.positive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {trend.value}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border ${
          isAlert
            ? 'bg-red-500/10 border-red-500/30 text-red-500'
            : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <span>{subtitle}</span>
          {isAlert && (
            <span className="font-semibold text-red-400 flex items-center gap-1">
              Action Required
            </span>
          )}
        </div>
      )}
    </div>
  );
};
