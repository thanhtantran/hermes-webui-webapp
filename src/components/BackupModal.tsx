import React, { useRef, useState } from 'react';
import { X, Download, Upload, AlertCircle, Database, Loader2, ShieldCheck, FileJson } from 'lucide-react';
import { HermesURL, ImportInstanceInput, Language } from '../types';
import { exportInstancesAsJson, parseImportPayload } from '../utils/storage';
import { translations } from '../utils/i18n';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  urls: HermesURL[];
  onImport: (imported: ImportInstanceInput[]) => Promise<void>;
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
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [imported, setImported] = useState<ImportInstanceInput[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const exportData = exportInstancesAsJson(urls);

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    setImported(null);
    setSelectedFile(null);

    if (!file.name.toLowerCase().endsWith('.json')) {
      setError(t.invalidJsonFile);
      return;
    }

    try {
      const parsed = parseImportPayload(await file.text());
      if (parsed.length === 0) {
        setError(t.noValidServers);
        return;
      }
      setSelectedFile(file.name);
      setImported(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.invalidJsonFile);
    }
  };

  const handleImportSubmit = async () => {
    if (!imported || imported.length === 0) {
      setError(t.invalidJsonFile);
      return;
    }
    setError(null);
    setIsImporting(true);
    try {
      await onImport(imported);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.requestFailed);
    } finally {
      setIsImporting(false);
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
              <div className="rounded-lg border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-5 flex flex-col items-center text-center gap-1.5">
                <FileJson className="w-8 h-8 text-cyan-600 dark:text-cyan-400 stroke-[1.5]" />
                <p className="text-sm font-bold tabular-nums">
                  {urls.length} {urls.length === 1 ? t.serversSingular : t.serverCount}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  hermes-servers-backup-{new Date().toISOString().slice(0, 10)}.json
                </p>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>{t.backupNoPasswords}</span>
              </p>
              <div className="pt-1">
                <button
                  onClick={handleDownload}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 px-4 py-5 flex flex-col items-center text-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileJson className="w-8 h-8 text-slate-400 dark:text-slate-500 stroke-[1.5]" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.chooseJsonFile}
                </span>
                {selectedFile && imported ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 break-all">
                    {selectedFile} · {imported.length} {imported.length === 1 ? t.serversSingular : t.serverCount}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t.fileJsonHint}
                  </span>
                )}
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={isImporting || !imported}
                className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{isImporting ? t.loadingInstances : t.importBtn}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
