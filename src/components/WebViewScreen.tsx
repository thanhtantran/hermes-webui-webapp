import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  RotateCw,
  ExternalLink,
  Key,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Lock,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';
import { HermesURL, ViewportMode, Language, Theme } from '../types';
import { translations } from '../utils/i18n';

interface WebViewScreenProps {
  urlData: HermesURL;
  onBack: () => void;
  currentLang: Language;
  currentTheme: Theme;
  onToggleTheme: () => void;
}

export const WebViewScreen: React.FC<WebViewScreenProps> = ({
  urlData,
  onBack,
  currentLang,
  currentTheme,
  onToggleTheme,
}) => {
  const t = translations[currentLang];
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState<ViewportMode>('mobile');
  // Use proxy bypass by default so X-Frame-Options is stripped
  const [useProxyBypass, setUseProxyBypass] = useState(true);
  const [showHelperBanner, setShowHelperBanner] = useState(false);

  // Determine iframe source URL: either through backend proxy or direct
  const iframeSource = useMemo(() => {
    if (useProxyBypass) {
      return `/api/proxy?url=${encodeURIComponent(urlData.url)}`;
    }
    return urlData.url;
  }, [useProxyBypass, urlData.url]);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const copyPassword = () => {
    if (!urlData.password) return;
    navigator.clipboard.writeText(urlData.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHelperBanner(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [iframeKey]);

  const getViewportContainerClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-full max-w-[390px] h-[780px] rounded-[36px] shadow-2xl border-[10px] border-slate-800 dark:border-slate-900 bg-black overflow-hidden ring-1 ring-slate-700/60 dark:ring-slate-800/80 my-3';
      case 'tablet':
        return 'w-full max-w-[768px] h-[820px] rounded-[28px] shadow-2xl border-[12px] border-slate-800 dark:border-slate-900 bg-black overflow-hidden ring-1 ring-slate-700/60 dark:ring-slate-800/80 my-3';
      case 'responsive':
      default:
        return 'w-full h-full flex-1 rounded-none border-0';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-mono transition-colors">
      {/* Top Console Navigation Bar */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 px-3 py-2.5 shadow-xs shrink-0 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-300 dark:border-slate-800 flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer"
            title="Return to console overview"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.backToConsole}</span>
          </button>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
              {urlData.name}
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate opacity-90">
              {urlData.url}
            </p>
          </div>
        </div>

        {/* Viewport Modes, Proxy Switcher & Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Proxy Mode Toggle (Bypass X-Frame-Options) */}
          <button
            onClick={() => {
              setUseProxyBypass(!useProxyBypass);
              handleReload();
            }}
            className={`px-2 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition-all cursor-pointer ${
              useProxyBypass
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
            title={useProxyBypass ? t.proxyDesc : 'Click to enable proxy bypass'}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline font-bold">
              {useProxyBypass ? t.proxyActive : t.proxyDirect}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={currentTheme === 'dark' ? t.lightTheme : t.darkTheme}
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
          </button>

          {/* Viewport Toggles (Desktop only) */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Mobile Device View (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Tablet Device View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('responsive')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewport === 'responsive'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Full Window View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Password Button (if saved) */}
          {urlData.saveCredentials && urlData.password && (
            <button
              onClick={copyPassword}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy saved password to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t.copiedShort}</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">{t.copyPass}</span>
                </>
              )}
            </button>
          )}

          {/* Reload Button */}
          <button
            onClick={handleReload}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Reload frame session"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Open as Standalone App Window (React Native Equivalent) */}
          <button
            onClick={() => {
              const width = 430;
              const height = 840;
              const left = Math.max(0, Math.round((window.screen.width - width) / 2));
              const top = Math.max(0, Math.round((window.screen.height - height) / 2));
              window.open(
                urlData.url,
                `Hermes_${urlData.id}`,
                `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`
              );
            }}
            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
            title={t.openAppWindowDesc}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t.openAppWindow}</span>
          </button>

          {/* Open in external tab button */}
          <a
            href={urlData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
            title="Open Hermes directly in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Auto-login & Credential info strip */}
      <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-4 py-1.5 text-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {urlData.saveCredentials ? (
            <span className="inline-flex items-center gap-1 text-cyan-700 dark:text-cyan-400 text-[11px]">
              <Lock className="w-3 h-3" />
              {t.autoLoginReady}
              {urlData.password && (
                <span className="text-slate-500 text-[10px] ml-1">
                  (••••••••)
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">
              {t.noCredsSession}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 hidden sm:inline">
            ✓ {useProxyBypass ? 'Bypass X-Frame-Options ON' : 'Direct URL Mode'}
          </span>
          <a
            href={urlData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 dark:text-cyan-400 hover:underline text-[11px] flex items-center gap-1 font-medium"
          >
            <span>{t.launchDirect}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main WebView Content Area */}
      <div className="flex-1 bg-slate-200/50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-auto p-2 sm:p-4">
        <div className={`relative flex flex-col ${getViewportContainerClass()} transition-all duration-300`}>
          {/* Mobile phone camera notch simulation */}
          {viewport === 'mobile' && (
            <div className="h-6 bg-slate-800 dark:bg-slate-900 w-full flex items-center justify-center shrink-0">
              <div className="w-20 h-3 bg-black rounded-full" />
            </div>
          )}

          {/* IFrame with Proxy Bypass source */}
          <div className="relative w-full h-full flex-1 bg-white">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
                <Loader2 className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-spin mb-3" />
                <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">{t.loadingFrame}</p>
                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">{urlData.url}</p>
                {useProxyBypass && (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30">
                    Bypassing X-Frame-Options via Server Proxy
                  </span>
                )}
              </div>
            )}

            <iframe
              key={`${iframeKey}-${useProxyBypass}`}
              ref={iframeRef}
              src={iframeSource}
              title={urlData.name}
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
              allow="microphone; camera; clipboard-read; clipboard-write; fullscreen"
            />
          </div>

          {/* Mobile home indicator simulation */}
          {viewport === 'mobile' && (
            <div className="h-4 bg-slate-800 dark:bg-slate-900 w-full flex items-center justify-center shrink-0">
              <div className="w-28 h-1 bg-slate-500 dark:bg-slate-700 rounded-full" />
            </div>
          )}
        </div>

        {/* Security fallback notification banner */}
        {showHelperBanner && (
          <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-slate-800 p-3.5 rounded-xl shadow-2xl text-xs text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 font-mono">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">{t.securityNoticeTitle}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  {t.securityNoticeDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {urlData.saveCredentials && urlData.password && (
                <button
                  onClick={copyPassword}
                  className="flex-1 sm:flex-none px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-300 dark:border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? t.copiedShort : t.copyPass}</span>
                </button>
              )}
              <a
                href={urlData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 rounded-lg font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <span>{t.openTabBtn}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
