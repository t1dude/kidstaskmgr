import { useState, useEffect } from 'react';
import { Share, X, MoreVertical } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const DISMISSED_KEY = 'pwaDismissedAt';
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true;
}

function wasDismissedRecently() {
  const ts = localStorage.getItem(DISMISSED_KEY);
  return ts ? Date.now() - Number(ts) < DISMISS_TTL_MS : false;
}

export function PWAPrompt() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;

    if (isIOS()) {
      setPlatform('ios');
      setVisible(true);
      return;
    }

    if (isAndroid()) {
      setPlatform('android');
      setVisible(true);

      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible || !platform) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-md mx-auto bg-indigo-600 text-white rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <img src="/icon.svg" alt="" className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{t.pwaInstallTitle}</p>
            {platform === 'ios' && (
              <p className="text-xs text-indigo-200 mt-0.5">
                {t.pwaInstallIOSStep1}{' '}
                <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" />
                {' '}{t.pwaInstallIOSStep2}
              </p>
            )}
            {platform === 'android' && !deferredPrompt && (
              <p className="text-xs text-indigo-200 mt-0.5">
                {t.pwaInstallAndroidManual1}{' '}
                <MoreVertical className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" />
                {' '}{t.pwaInstallAndroidManual2}
              </p>
            )}
            {platform === 'android' && deferredPrompt && (
              <p className="text-xs text-indigo-200 mt-0.5">{t.pwaInstallAndroid}</p>
            )}
          </div>
          <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-full hover:bg-indigo-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {platform === 'android' && deferredPrompt && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={install}
              className="flex-1 bg-white text-indigo-600 text-sm font-semibold py-2 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              {t.pwaInstallButton}
            </button>
            <button
              onClick={dismiss}
              className="flex-1 bg-indigo-500 text-white text-sm py-2 rounded-xl hover:bg-indigo-400 transition-colors"
            >
              {t.pwaInstallDismiss}
            </button>
          </div>
        )}

        {(platform === 'ios' || (platform === 'android' && !deferredPrompt)) && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={dismiss}
              className="text-xs text-indigo-200 hover:text-white transition-colors px-2 py-1"
            >
              {t.pwaInstallDismiss}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
