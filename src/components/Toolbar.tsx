import React from 'react';
import { Search, RotateCw } from 'lucide-react';
import { Language, PingResult, HermesURL } from '../types';
import { translations } from '../utils/i18n';

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPingAll: () => void;
  isPingingAll: boolean;
  lastCheckedTime: number | null;
  urls: HermesURL[];
  pingResults: Record<string, PingResult>;
  currentLang: Language;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onPingAll,
  isPingingAll,
  lastCheckedTime,
  urls,
  pingResults,
  currentLang,
}) => {
  const t = translations[currentLang];

  // Calculate live counts
  const onlineCount = urls.filter((u) => pingResults[u.id]?.status === 'online').length;
  const offlineCount = urls.filter((u) => pingResults[u.id]?.status === 'offline').length;

  const formatLastChecked = () => {
    if (!lastCheckedTime) return t.never;
    const diffSec = Math.floor((Date.now() - lastCheckedTime) / 1000);
    if (diffSec < 5) return t.justNow;
    if (diffSec < 60) return `${diffSec}${t.secondsAgo}`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}${t.minutesAgo}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 mb-6 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors duration-200">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
        />
      </div>

      {/* Health Stats & Ping All Trigger */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        {/* Status Counts */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="tabular-nums font-semibold">{onlineCount}</span> {t.online}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span className="tabular-nums font-semibold">{offlineCount}</span> {t.offline}
          </span>
        </div>

        {/* Sweep timestamp & Ping All Button */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
            {t.lastChecked}: <span className="text-slate-700 dark:text-slate-400 tabular-nums">{formatLastChecked()}</span>
          </span>

          <button
            onClick={onPingAll}
            disabled={isPingingAll || urls.length === 0}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isPingingAll
                ? 'bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 cursor-wait'
                : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-700/80 active:scale-98'
            }`}
            title="Ping all registered server endpoints"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isPingingAll ? 'animate-spin text-cyan-500' : ''}`} />
            <span>{isPingingAll ? t.pinging : t.pingAll}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
