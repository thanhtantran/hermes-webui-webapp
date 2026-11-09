import React from 'react';
import { LogOut, Moon, Plus, Sun, Terminal, Download } from 'lucide-react';
import { AuthUser, Language, Theme } from '../types';
import { translations } from '../utils/i18n';

interface HeaderProps {
  serverCount: number;
  currentLang: Language;
  onToggleLanguage: (lang: Language) => void;
  currentTheme: Theme;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenBackupModal: () => void;
  user: AuthUser;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  serverCount,
  currentLang,
  onToggleLanguage,
  currentTheme,
  onToggleTheme,
  onOpenAddModal,
  onOpenBackupModal,
  user,
  onLogout,
}) => {
  const t = translations[currentLang];
  const initials = (user.name || user.email)
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 text-slate-900 dark:text-slate-100 sticky top-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-950/95 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 py-2.5 sm:px-6">
        {/* Row 1: Brand & Language Switcher */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner">
              <Terminal className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-slate-900 dark:text-slate-100 font-mono">
                HERMES<span className="text-cyan-600 dark:text-cyan-400">.UI</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 tabular-nums">
                {serverCount} {serverCount === 1 ? t.serversSingular : t.serverCount}
              </span>
            </div>
          </div>

          {/* Account & Language Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => onToggleLanguage('en')}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                  currentLang === 'en'
                    ? 'bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-cyan-500/30 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => onToggleLanguage('vi')}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all cursor-pointer ${
                  currentLang === 'vi'
                    ? 'bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-cyan-500/30 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Chuyển sang Tiếng Việt"
              >
                VI
              </button>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden lg:block text-right min-w-0">
                <div className="text-[9px] text-slate-500 dark:text-slate-500 tracking-wider">
                  {t.signedInAs}
                </div>
                <div
                  className="text-[11px] font-semibold max-w-[180px] truncate"
                  title={user.email}
                >
                  {user.name || user.email}
                </div>
              </div>

              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {initials || '?'}
                </div>
              )}

              <button
                onClick={onLogout}
                title={t.logout}
                aria-label={t.logout}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-900 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-500/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Controls moved to second line (Theme Toggle, Backup & Add Server) */}
        <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono transition-colors cursor-pointer"
              title={currentTheme === 'dark' ? t.lightTheme : t.darkTheme}
              aria-label={t.themeToggle}
            >
              {currentTheme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px]">{t.lightTheme}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span className="text-[11px]">{t.darkTheme}</span>
                </>
              )}
            </button>

            {/* Backup Button */}
            <button
              onClick={onOpenBackupModal}
              title={t.backup}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px]">{t.backup}</span>
            </button>
          </div>

          {/* Add Server Button */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer transform active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t.addServer}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
