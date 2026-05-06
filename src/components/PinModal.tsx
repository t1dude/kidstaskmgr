import { useState } from 'react';
import { api } from '../lib/api';

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

  const dm = darkMode;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { token } = await api.login(pin);
      onSuccess(token);
    } catch (err: any) {
      setError(err?.message || 'Kunne ikke koble til serveren');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-8 ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-2xl font-bold mb-2 text-center ${dm ? 'text-gray-100' : 'text-gray-800'}`}>
          Admin innlogging
        </h2>
        <p className={`text-center mb-6 text-sm ${dm ? 'text-gray-400' : 'text-gray-500'}`}>
          Skriv inn PIN-koden for å åpne innstillinger
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN-kode"
            autoFocus
            className={`w-full text-center text-2xl tracking-widest py-3 rounded-xl border-2 outline-none focus:border-blue-500 transition-colors ${
              dm
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
                : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'
            }`}
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logger inn...' : 'Logg inn'}
          </button>
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Avbryt
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
