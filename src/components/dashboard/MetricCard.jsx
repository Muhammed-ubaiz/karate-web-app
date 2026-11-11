import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, isAlert, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-3 sm:p-4 lg:p-5 bg-dojo-card border transition-all duration-200 min-w-0 ${
        isAlert
          ? 'border-red-500/40 bg-gradient-to-b from-red-50 to-white dark:from-red-950/20 dark:to-dojo-card shadow-lg shadow-red-500/10 dark:shadow-red-950/30'
          : 'border-dojo-border hover:border-zinc-700/80 hover:bg-dojo-cardHover'
      } ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''}`}
    >
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 tracking-wide uppercase truncate">{title}</p>
          <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight break-words">{value}</h3>
            {trend && (
              <span className={`inline-flex items-center text-[10px] sm:text-xs font-bold shrink-0 ${
                trend.positive ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {trend.positive ? <ArrowUpRight className="w-3 h-3 mr-0.5 shrink-0" /> : <ArrowDownRight className="w-3 h-3 mr-0.5 shrink-0" />}
                <span className="whitespace-nowrap">{trend.value}</span>
              </span>
            )}
          </div>
        </div>

        <div className={`p-1.5 sm:p-2.5 rounded-xl border shrink-0 ${
          isAlert
            ? 'bg-red-500/10 border-red-500/30 text-red-500'
            : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300'
        }`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {subtitle && (
        <div className="mt-2 sm:mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-zinc-400 min-w-0 gap-1">
          <span className="truncate">{subtitle}</span>
          {isAlert && (
            <span className="font-semibold text-red-400 flex items-center gap-0.5 shrink-0">
              Alert
            </span>
          )}
        </div>
      )}
    </div>
  );
};
