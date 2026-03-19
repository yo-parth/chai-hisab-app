import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BottomNav } from '@/components/BottomNav';
import { Lock, Save, Download, Upload, DatabaseBackup, Globe } from 'lucide-react';
import {
  getSettings,
  saveSettings,
  Settings as SettingsType,
  isEncryptionEnabled,
  enableEncryption,
  disableEncryption,
  exportBackup,
  importBackup,
} from '@/lib/db';
import { getActiveKey } from '@/lib/crypto';
import { toast } from 'sonner';
import { useTranslation, Language } from '@/lib/i18n';

export default function Settings() {
  const [defaultPrice, setDefaultPrice] = useState(10);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [hasActiveKey, setHasActiveKey] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t, language, setLanguage } = useTranslation();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    setDefaultPrice(data.default_price ?? 10);
    const encOn = await isEncryptionEnabled();
    setPinEnabled(encOn);
    setHasActiveKey(getActiveKey() !== null);
  };

  const handleSave = async () => {
    const encCurrentlyOn = await isEncryptionEnabled();

    if (pinEnabled && !encCurrentlyOn) {
      if (pin.length !== 4) {
        toast.error(t('pinMustBe4'));
        return;
      }
    }

    setSaving(true);
    try {
      const current = await getSettings();
      await saveSettings({
        ...current,
        default_price: defaultPrice,
      } as SettingsType);

      if (pinEnabled && !encCurrentlyOn) {
        await enableEncryption(pin);
        setHasActiveKey(true);
        toast.success(t('settingsSaved'));
      } else if (!pinEnabled && encCurrentlyOn) {
        await disableEncryption();
        setHasActiveKey(false);
        toast.success(t('settingsSaved'));
      } else {
        toast.success(t('settingsSaved'));
      }

      setPin('');
    } catch {
      toast.error(t('settingsFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ─── Backup ────────────────────────────────────────────────────────────────

  const handleExportBackup = async () => {
    setBackupLoading(true);
    try {
      const blob = await exportBackup();
      const date = new Date().toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `chai-khata-backup-${date}.ckb`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success(t('backupSuccess'));
    } catch {
      toast.error(t('backupFailed'));
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setRestoreLoading(true);
    try {
      await importBackup(file);
      toast.success(t('restoreSuccess'));
      window.location.reload();
    } catch {
      toast.error(t('restoreFailed'));
      setRestoreLoading(false);
    }
  };

  const backupBusy = backupLoading || restoreLoading;

  // ─── Language toggle ───────────────────────────────────────────────────────

  const handleLanguageChange = async (lang: Language) => {
    await setLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary p-6">
        <h1 className="text-[22px] font-medium text-white">{t('settingsTitle')}</h1>
        <p className="text-[13px] text-white/60">{t('settingsSubtitle')}</p>
      </div>

      <div className="p-4 pb-24 space-y-4">
        {/* Default Price */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-4">{t('defaultSettingsSection')}</h2>
          <div className="space-y-2">
            <Label htmlFor="price">{t('pricePerCupLabel')}</Label>
            <Input
              id="price"
              type="number"
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 10)}
              min="1"
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">{t('priceHelp')}</p>
          </div>
        </div>

        {/* PIN Security */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {t('securitySection')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pin-toggle">{t('pinSecurity')}</Label>
                <p className="text-[12px] text-muted-foreground mt-1">{t('pinSecurityHelp')}</p>
              </div>
              <Switch id="pin-toggle" checked={pinEnabled} onCheckedChange={setPinEnabled} />
            </div>

            {pinEnabled && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="pin">{t('pin4digitsLabel')}</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="bg-background border-border tracking-[0.25em]"
                />
                <p className="text-xs text-muted-foreground">{t('pinWarning')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 bg-primary text-white text-[14px] font-medium rounded-xl border border-border hover:bg-[#68330F]"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? t('saveBtnBusy') : t('saveBtnIdle')}
        </Button>

        {/* Data Backup */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <DatabaseBackup className="w-4 h-4" />
            {t('dataBackupSection')}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {hasActiveKey ? t('backupHint') : t('backupNeedsPin')}
          </p>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleExportBackup}
              disabled={!hasActiveKey || backupBusy}
              className="w-full h-[52px] bg-white border border-border rounded-xl text-[14px] font-medium text-primary hover:bg-[#FDF8F3] transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {backupLoading ? t('preparingBackup') : t('takeBackup')}
            </Button>

            <Button
              variant="outline"
              onClick={handleRestoreClick}
              disabled={!hasActiveKey || backupBusy}
              className="w-full h-[52px] bg-white border border-border rounded-xl text-[14px] font-medium text-primary hover:bg-[#FDF8F3] transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              {restoreLoading ? t('restoring') : t('restoreBackup')}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".ckb"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
        </div>

        {/* Language Toggle */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-[11px] font-medium text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('languageSection')}
          </h2>
          <div className="flex gap-1 bg-white border border-border rounded-[24px] p-1 w-full">
            <button
              onClick={() => handleLanguageChange('hi')}
              className={`flex-1 py-1.5 rounded-[20px] text-sm font-medium transition-colors ${
                language === 'hi'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-primary hover:bg-primary/5'
              }`}
            >
              {t('hindiLabel')}
            </button>
            <button
              onClick={() => handleLanguageChange('mr')}
              className={`flex-1 py-1.5 rounded-[20px] text-sm font-medium transition-colors ${
                language === 'mr'
                  ? 'bg-primary text-white'
                  : 'bg-transparent text-primary hover:bg-primary/5'
              }`}
            >
              {t('marathiLabel')}
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>{t('appVersion')}</p>
          <p className="mt-1">{t('appInfo')}</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
