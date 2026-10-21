import React, { useState } from 'react';
import { X, Download, Upload, Copy, Check, AlertCircle, Database } from 'lucide-react';
import { HermesURL, Language } from '../types';
import { exportUrlsAsJson, importUrlsFromJson } from '../utils/storage';
import { translations } from '../utils/i18n';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  urls: HermesURL[];
  onImport: (imported: HermesURL[]) => void;
  currentLang: Language;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  urls,
  onImport,
  currentLang,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportData = exportUrlsAsJson(urls);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hermes-servers-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    setError(null);
    if (!importText.trim()) {
      setError(currentLang === 'vi' ? 'Vui lòng dán nội dung JSON để nhập' : 'Please paste a valid JSON string');
      return;
    }
    try {
      const imported = importUrlsFromJson(importText.trim());
      if (imported.length === 0) {
        setError(currentLang === 'vi' ? 'Không tìm thấy máy chủ hợp lệ nào' : 'No valid servers discovered in payload');
        return;
      }
      onImport(imported);
      onClose();
    } catch (err: any) {
      setError(err?.message || (currentLang === 'vi' ? 'Lỗi cú pháp JSON' : 'JSON Syntax Error'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden text-slate-900 dark:text-slate-100 font-mono transition-colors">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold tracking-wider">{t.backupTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-white dark:bg-slate-900/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportTab} ({urls.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-cyan-500 text-cyan-700 dark:text-cyan-400 bg-white dark:bg-slate-900/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.importTab}</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.exportDesc}
              </p>
              <textarea
                readOnly
                value={exportData}
                rows={6}
                className="w-full p-2.5 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 resize-none focus:outline-hidden"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.copied : t.copyJson}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadJson}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.importDesc}
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='[ { "name": "Hermes Host", "url": "https://..." } ]'
                rows={6}
                className="w-full p-2.5 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-200 resize-none focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <button
                onClick={handleImportSubmit}
                className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t.importBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
