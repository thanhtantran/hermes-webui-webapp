import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyRound,
  Loader2,
  Moon,
  ShieldCheck,
  Sun,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import type { AuthUser, Language, Theme } from '../types';
import { getAuthConfig, loginWithGoogle } from '../utils/api';
import { getGoogleIdentity, loadGoogleIdentity } from '../utils/google';
import { translations } from '../utils/i18n';
import { Footer } from './Footer';

interface LoginScreenProps {
  currentLang: Language;
  currentTheme: Theme;
  onToggleLanguage: (lang: Language) => void;
  onToggleTheme: () => void;
  onAuthenticated: (user: AuthUser, csrfToken: string) => void;
  notice?: string | null;
  onDismissNotice?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  currentLang,
  currentTheme,
  onToggleLanguage,
  onToggleTheme,
  onAuthenticated,
  notice,
  onDismissNotice,
}) => {
  const t = translations[currentLang];
  const buttonRef = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [buttonReady, setButtonReady] = useState(false);

  const handleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setError(t.loginAuthError);
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const auth = await loginWithGoogle(response.credential);
        onAuthenticated(auth.user, auth.csrfToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loginAuthError);
      } finally {
        setBusy(false);
      }
    },
    [onAuthenticated, t.loginAuthError]
  );

  useEffect(() => {
    let cancelled = false;
    getAuthConfig()
      .then((config) => {
        if (cancelled) return;
        if (!config.googleClientId) {
          setError(t.loginConfigError);
          return;
        }
        setClientId(config.googleClientId);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t.loginConfigError);
      });

    return () => {
      cancelled = true;
    };
  }, [t.loginConfigError]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    (async () => {
      try {
        await loadGoogleIdentity();
        if (cancelled || !buttonRef.current) return;

        const identity = getGoogleIdentity();
        if (!identity) throw new Error(t.loginScriptError);

        identity.initialize({
          client_id: clientId,
          callback: (response) => {
            void handleCredential(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        buttonRef.current.innerHTML = '';
        identity.renderButton(buttonRef.current, {
          type: 'standard',
          theme: currentTheme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 300,
          logo_alignment: 'left',
        });
        setButtonReady(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t.loginScriptError);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId, currentTheme, handleCredential, t.loginScriptError]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-mono transition-colors">
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Terminal className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wider">
                HERMES<span className="text-cyan-600 dark:text-cyan-400">.UI</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {t.appSubtitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
              {(['en', 'vi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onToggleLanguage(lang)}
                  className={`px-2.5 py-1 text-[11px] font-mono font-medium rounded transition-all cursor-pointer ${
                    currentLang === lang
                      ? 'bg-white dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-cyan-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={currentTheme === 'dark' ? t.lightTheme : t.darkTheme}
            >
              {currentTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h1 className="text-lg font-bold tracking-tight">{t.loginTitle}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {t.loginSubtitle}
              </p>

              <ul className="mt-5 space-y-2.5">
                <li className="flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <span>{t.loginBenefitAccounts}</span>
                </li>
                <li className="flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <span>{t.loginBenefitEncryption}</span>
                </li>
                <li className="flex items-start gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 mt-0.5 shrink-0" />
                  <span>{t.loginBenefitApi}</span>
                </li>
              </ul>

              {notice && (
                <div className="mt-5 p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 text-[11px] rounded-lg flex items-start gap-2">
                  <span className="flex-1">{notice}</span>
                  {onDismissNotice && (
                    <button
                      onClick={onDismissNotice}
                      className="p-0.5 hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                      aria-label={t.dismiss}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-5 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-[11px] rounded-lg flex items-start gap-2">
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="p-0.5 hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
                    aria-label={t.dismiss}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="mt-6 min-h-[48px] flex items-center justify-center">
                {busy ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                    <span>{t.loginVerifying}</span>
                  </div>
                ) : (
                  <div ref={buttonRef} className={buttonReady ? '' : 'hidden'} />
                )}
              </div>

              {!buttonReady && !busy && (
                <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.loginLoading}</span>
                </div>
              )}

              <p className="mt-5 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                {t.loginGoogleHint}
              </p>
            </div>

            <div className="px-6 sm:px-8 py-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <KeyRound className="w-3 h-3 shrink-0" />
              <span>{t.passwordStoredServerSide}</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 dark:text-slate-500 mt-4">
            <Footer currentLang={currentLang} />
          </div>
        </div>
      </main>
    </div>
  );
};
