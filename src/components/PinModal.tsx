import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';

interface PinModalProps {
  onSuccess: (token: string) => void;
  onCancel: () => void;
  canCancel?: boolean;
}

export function PinModal({ onSuccess, onCancel, canCancel = true }: PinModalProps) {
  const [darkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (retryAfter <= 0) return;
    const timer = setInterval(() => {
      setRetryAfter((s) => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAfter]);

  const { t } = useLanguage();
  const dm = darkMode;
  const isLocked = retryAfter > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim() || isLocked) return;
    setLoading(true);
    setError('');
    try {
      const { token } = await api.login(pin, rememberMe);
      onSuccess(token);
    } catch (err: any) {
      setError(err?.message || 'Kunne ikke koble til serveren');
      if (err?.retryAfter) setRetryAfter(err.retryAfter);
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-8 ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-2 text-center ${dm ? 'text-gray-100' : 'text-gray-800'}`}>
          {t.pinTitle}
        </h2>
        <p className={`text-center mb-6 text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
          {t.pinDesc}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={t.pinPlaceholder}
            autoFocus
            disabled={isLocked}
            className={`w-full text-center text-2xl tracking-widest py-3 rounded-xl border-2 outline-none focus:border-blue-500 transition-colors ${
              dm
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
            } disabled:opacity-50`}
          />
          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}{isLocked ? ` (${retryAfter}s)` : ''}
            </p>
          )}
          <label className={`flex items-center gap-2 cursor-pointer select-none text-sm ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-500"
            />
            {t.rememberMe}
          </label>
          <button
            type="submit"
            disabled={loading || !pin.trim() || isLocked}
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t.signingIn : isLocked ? t.waitSeconds(retryAfter) : t.signIn}
          </button>
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.cancel}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
