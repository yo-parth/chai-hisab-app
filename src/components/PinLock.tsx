import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coffee, Lock } from 'lucide-react';
import { verifyPinAndUnlock } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';

interface PinLockProps {
  onUnlock: () => void;
}

export const PinLock = ({ onUnlock }: PinLockProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;

    setChecking(true);
    setError(false);

    try {
      const ok = await verifyPinAndUnlock(pin);
      if (ok) {
        onUnlock();
      } else {
        setError(true);
        setPin('');
      }
    } catch {
      setError(true);
      setPin('');
    } finally {
      setChecking(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    if (error) setError(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary p-6">
        <div className="flex items-center gap-3 mb-2">
          <Coffee className="w-8 h-8 text-white" />
          <h1 className="text-[22px] font-medium text-white">{t('appName')}</h1>
        </div>
        <p className="text-[13px] text-white/60">{t('tagline')}</p>
      </div>

      {/* PIN entry card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-border rounded-xl p-8 space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#FDF8F3] flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-[16px] font-medium">{t('enterPin')}</h2>
              <p className="text-sm text-muted-foreground text-center">{t('pinSecureMsg')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                placeholder="••••"
                className={`text-center text-2xl tracking-[0.5em] h-14 ${
                  error ? 'border-destructive focus-visible:ring-destructive' : ''
                }`}
                autoFocus
              />

              {error && (
                <p className="text-sm text-destructive text-center font-medium">{t('wrongPin')}</p>
              )}

              <Button
                type="submit"
                disabled={pin.length !== 4 || checking}
                className="w-full h-12 bg-primary text-white hover:bg-[#68330F] text-[14px] font-medium rounded-xl border border-border"
              >
                {checking ? t('checking') : t('openApp')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
