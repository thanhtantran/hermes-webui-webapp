import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { UrlCard } from './components/UrlCard';
import { UrlModal } from './components/UrlModal';
import { WebViewScreen } from './components/WebViewScreen';
import { BackupModal } from './components/BackupModal';
import { LoginScreen } from './components/LoginScreen';
import {
  AuthUser,
  HermesURL,
  ImportInstanceInput,
  InstanceInput,
  PingResult,
  Language,
  Theme,
} from './types';
import * as api from './utils/api';
import {
  getStoredLanguage,
  saveStoredLanguage,
  getStoredTheme,
  saveStoredTheme,
  translations,
} from './utils/i18n';
import {
  Server,
  Plus,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';

type AuthState = 'loading' | 'anonymous' | 'authenticated';

export default function App() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);

  const [urls, setUrls] = useState<HermesURL[]>([]);
  const [activeUrl, setActiveUrl] = useState<HermesURL | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HermesURL | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLang, setCurrentLang] = useState<Language>(getStoredLanguage);
  const [currentTheme, setCurrentTheme] = useState<Theme>(getStoredTheme);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Ping status tracking
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({});
  const [isPingingAll, setIsPingingAll] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<number | null>(null);

  const t = translations[currentLang];
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // Sync theme with document class and meta tag
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#090d16');
    } else {
      document.documentElement.classList.remove('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#f1f5f9');
    }
  }, [currentTheme]);

  const handleToggleTheme = () => {
    const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    saveStoredTheme(nextTheme);
  };

  // Probe the existing session once on startup (silent on 401)
  useEffect(() => {
    let cancelled = false;
    api
      .getMe(true)
      .then((auth) => {
        if (cancelled) return;
        api.setCsrfToken(auth.csrfToken);
        setUser(auth.user);
        setAuthState('authenticated');
      })
      .catch(() => {
        if (!cancelled) setAuthState('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Clear client state as soon as the server rejects the session
  useEffect(() => {
    const handleExpired = () => {
      api.setCsrfToken(null);
      setAuthState('anonymous');
      setUser(null);
      setUrls([]);
      setPingResults({});
      setActiveUrl(null);
      setIsModalOpen(false);
      setIsBackupOpen(false);
      setIsPingingAll(false);
      setLoginNotice(t.sessionExpired);
    };
    window.addEventListener('hermes:session-expired', handleExpired);
    return () => window.removeEventListener('hermes:session-expired', handleExpired);
  }, [t.sessionExpired]);

  const handleToggleLanguage = (newLang: Language) => {
    setCurrentLang(newLang);
    saveStoredLanguage(newLang);
  };

  const refreshInstances = useCallback(async (): Promise<HermesURL[]> => {
    setIsLoadingData(true);
    try {
      const list = await api.listInstances();
      setUrls(list);
      setAppError(null);
      return list;
    } catch (err) {
      setAppError(err instanceof Error ? err.message : tRef.current.requestFailed);
      return [];
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authState !== 'authenticated') return;
    void refreshInstances();
  }, [authState, refreshInstances]);

  // Ping a single server via the authenticated server-side probe
  const handlePingSingle = useCallback(async (item: HermesURL) => {
    setPingResults((prev) => ({
      ...prev,
      [item.id]: { status: 'checking' },
    }));

    try {
      const result = await api.pingInstance(item.id);
      setPingResults((prev) => ({
        ...prev,
        [item.id]: api.toPingResult(result),
      }));
    } catch (err) {
      setPingResults((prev) => ({
        ...prev,
        [item.id]: {
          status: 'offline',
          lastCheckedAt: Date.now(),
          error: err instanceof Error ? err.message : 'Ping failed',
        },
      }));
    }
  }, []);

  // Ping all servers concurrently
  const handlePingAll = useCallback(async (targets?: HermesURL[]) => {
    const listToPing = targets || urls;
    if (listToPing.length === 0) return;

    setIsPingingAll(true);

    // Set all to checking
    setPingResults((prev) => {
      const next = { ...prev };
      listToPing.forEach((u) => {
        next[u.id] = { ...next[u.id], status: 'checking' };
      });
      return next;
    });

    const results = await Promise.all(
      listToPing.map(async (u) => {
        try {
          const res = await api.pingInstance(u.id);
          return { id: u.id, pingResult: api.toPingResult(res) };
        } catch (err) {
          return {
            id: u.id,
            pingResult: {
              status: 'offline' as const,
              lastCheckedAt: Date.now(),
              error: err instanceof Error ? err.message : 'Ping failed',
            },
          };
        }
      })
    );

    setPingResults((prev) => {
      const next = { ...prev };
      results.forEach((r) => {
        next[r.id] = r.pingResult;
      });
      return next;
    });

    setLastCheckedTime(Date.now());
    setIsPingingAll(false);
  }, [urls]);

  // Ref to hold latest handlePingAll for interval
  const pingAllRef = useRef(handlePingAll);
  useEffect(() => {
    pingAllRef.current = handlePingAll;
  }, [handlePingAll]);

  // Auto-ping on initial load once instances are populated
  const hasInitialPingRun = useRef(false);
  useEffect(() => {
    if (authState === 'authenticated' && urls.length > 0 && !hasInitialPingRun.current) {
      hasInitialPingRun.current = true;
      void handlePingAll(urls);
    }
  }, [authState, urls, handlePingAll]);

  // Periodic polling every 30 seconds while signed in
  useEffect(() => {
    if (authState !== 'authenticated') return;
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void pingAllRef.current();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [authState]);

  const handleAuthenticated = (authUser: AuthUser, csrfToken: string) => {
    api.setCsrfToken(csrfToken);
    setUser(authUser);
    setLoginNotice(null);
    setAppError(null);
    setAuthState('authenticated');
    hasInitialPingRun.current = false;
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Session may already be invalid on the server.
    }
    api.setCsrfToken(null);
    setAuthState('anonymous');
    setUser(null);
    setUrls([]);
    setPingResults({});
    setLastCheckedTime(null);
    setActiveUrl(null);
    setIsModalOpen(false);
    setIsBackupOpen(false);
    setSearchQuery('');
    setLoginNotice(null);
    setAppError(null);
    hasInitialPingRun.current = false;
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: HermesURL) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (data: InstanceInput, id?: string) => {
    if (id) {
      const updated = await api.updateInstance(id, data);
      setUrls((prev) => prev.map((u) => (u.id === id ? updated : u)));
      void handlePingSingle(updated);
    } else {
      const created = await api.createInstance(data);
      setUrls((prev) => [...prev, created]);
      void handlePingSingle(created);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteInstance(id);
      setUrls((prev) => prev.filter((u) => u.id !== id));
      setPingResults((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setAppError(err instanceof Error ? err.message : t.requestFailed);
    }
  };

  const handleConnect = async (item: HermesURL) => {
    try {
      const updated = await api.connectInstance(item.id);
      setUrls((prev) => prev.map((u) => (u.id === item.id ? updated : u)));
      setActiveUrl(updated);
    } catch (err) {
      setAppError(err instanceof Error ? err.message : t.requestFailed);
    }
  };

  const handleImportSuccess = async (imported: ImportInstanceInput[]) => {
    const result = await api.importInstances(imported);
    setUrls(result.instances);
    setAppError(null);
    void handlePingAll(result.instances);
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center gap-3 font-mono transition-colors">
        <Loader2 className="w-7 h-7 text-cyan-500 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">{t.loadingConsole}</p>
      </div>
    );
  }

  if (authState === 'anonymous' || !user) {
    return (
      <LoginScreen
        currentLang={currentLang}
        currentTheme={currentTheme}
        onToggleLanguage={handleToggleLanguage}
        onToggleTheme={handleToggleTheme}
        onAuthenticated={handleAuthenticated}
        notice={loginNotice}
        onDismissNotice={() => setLoginNotice(null)}
      />
    );
  }

  // If connected to a server instance, render WebView Session Screen
  if (activeUrl) {
    return (
      <WebViewScreen
        urlData={activeUrl}
        onBack={() => setActiveUrl(null)}
        currentLang={currentLang}
        currentTheme={currentTheme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  const filteredUrls = urls.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-mono selection:bg-cyan-500/30 selection:text-cyan-600 dark:selection:text-cyan-200 transition-colors duration-200">
      {/* Terminal Top Navigation Bar */}
      <Header
        serverCount={urls.length}
        currentLang={currentLang}
        onToggleLanguage={handleToggleLanguage}
        currentTheme={currentTheme}
        onToggleTheme={handleToggleTheme}
        onOpenAddModal={handleOpenAdd}
        onOpenBackupModal={() => setIsBackupOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Terminal Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:px-6">
        {appError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{appError}</span>
            <button
              onClick={() => setAppError(null)}
              className="p-0.5 hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
              aria-label={t.dismiss}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isLoadingData && urls.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500 dark:text-slate-400">
            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
            <p className="text-xs">{t.loadingInstances}</p>
          </div>
        ) : (
          <>
            {/* Telemetry & Search Toolbar */}
            <Toolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onPingAll={() => handlePingAll()}
              isPingingAll={isPingingAll}
              lastCheckedTime={lastCheckedTime}
              urls={urls}
              pingResults={pingResults}
              currentLang={currentLang}
            />

            {/* Server Endpoint Grid / List */}
            {filteredUrls.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center shadow-xs">
                <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Server className="w-6 h-6 stroke-[1.8]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 tracking-wider uppercase">
                  {searchQuery ? t.noSearchMatch : t.noServersTitle}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto mb-5 leading-relaxed">
                  {searchQuery
                    ? `${t.noSearchMatch}: "${searchQuery}"`
                    : t.noServersDesc}
                </p>
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{t.addFirstServer}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredUrls.map((item) => (
                  <UrlCard
                    key={item.id}
                    item={item}
                    pingResult={pingResults[item.id]}
                    onConnect={handleConnect}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onPingSingle={handlePingSingle}
                    currentLang={currentLang}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/80 py-3 px-4 text-center text-[11px] text-slate-500">
        <p className="font-mono">
          HERMES.UI CONSOLE · AUTHENTICATED ACCESS
        </p>
      </footer>

      {/* Add / Edit Modal */}
      <UrlModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        editingItem={editingItem}
        currentLang={currentLang}
      />

      {/* Backup / Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        urls={urls}
        onImport={handleImportSuccess}
        currentLang={currentLang}
      />
    </div>
  );
}
