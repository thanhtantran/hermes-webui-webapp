import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Key, Link2, Terminal } from 'lucide-react';
import { HermesURL, Language } from '../types';
import { translations } from '../utils/i18n';

interface UrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<HermesURL, 'id'>, id?: string) => void;
  editingItem: HermesURL | null;
  currentLang: Language;
}

export const UrlModal: React.FC<UrlModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  currentLang,
}) => {
  const t = translations[currentLang];
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [password, setPassword] = useState('');
  const [saveCredentials, setSaveCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setUrl(editingItem.url);
      setPassword(editingItem.password || '');
      setSaveCredentials(editingItem.saveCredentials);
    } else {
      setName('');
      setUrl('');
      setPassword('');
      setSaveCredentials(false);
    }
    setError(null);
    setShowPassword(false);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(currentLang === 'vi' ? 'Vui lòng nhập tên định danh máy chủ' : 'Please specify a server name');
      return;
    }

    let trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError(currentLang === 'vi' ? 'Vui lòng nhập URL máy chủ' : 'Please specify an endpoint URL');
      return;
    }

    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      trimmedUrl = `https://${trimmedUrl}`;
    }

    try {
      new URL(trimmedUrl);
    } catch {
      setError(currentLang === 'vi' ? 'Định dạng URL không hợp lệ (ví dụ: https://192.168.1.100:8080)' : 'Invalid URL syntax (e.g. https://192.168.1.100:8080)');
      return;
    }

    onSave(
      {
        name: name.trim(),
        url: trimmedUrl,
        password: saveCredentials ? password : '',
        saveCredentials,
      },
      editingItem?.id
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100 font-mono transition-colors">
        {/* Modal Header */}
        <div className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold tracking-wider">
              {editingItem ? t.modalEditTitle : t.modalAddTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              {t.serverNameLabel}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.serverNamePlaceholder}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              {t.serverUrlLabel}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-600">
                <Link2 className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.serverUrlPlaceholder}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {t.urlNote}
            </p>
          </div>

          {/* Save Credentials Checkbox */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveCredentials}
                onChange={(e) => setSaveCredentials(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-cyan-600 dark:text-cyan-500 focus:ring-cyan-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  {t.saveCredsLabel}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.saveCredsDesc}
                </p>
              </div>
            </label>
          </div>

          {/* Password Input (conditional) */}
          {saveCredentials && (
            <div className="pl-6 pt-1 space-y-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-xs focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              {t.btnCancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-mono font-bold shadow-xs transition-colors cursor-pointer"
            >
              {editingItem ? t.btnSave : t.btnAdd}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
