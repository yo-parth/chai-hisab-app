import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BottomNav } from '@/components/BottomNav';
import { Lock, Save } from 'lucide-react';
import { getSettings, saveSettings, Settings as SettingsType } from '@/lib/db';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType>({ default_price: 10 });
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
    setPinEnabled(!!data.pin);
    setPin(data.pin || '');
  };

  const handleSave = async () => {
    if (pinEnabled && pin.length !== 4) {
      toast.error('PIN 4 अंकों का होना चाहिए');
      return;
    }

    setSaving(true);
    try {
      const newSettings: SettingsType = {
        default_price: settings.default_price,
        pin: pinEnabled ? pin : undefined
      };
      await saveSettings(newSettings);
      toast.success('सेटिंग्स सेव हो गईं');
    } catch (error) {
      toast.error('सेव नहीं हो सका');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-chai text-primary-foreground p-6 shadow-card">
        <h1 className="text-2xl font-bold">सेटिंग्स</h1>
        <p className="text-sm opacity-90 mt-1">अपनी पसंद के अनुसार सेट करें</p>
      </div>

      <div className="p-6 pb-24 space-y-6">
        {/* Default Price */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">डिफ़ॉल्ट सेटिंग्स</h2>
          <div className="space-y-2">
            <Label htmlFor="price">प्रति कप कीमत (₹)</Label>
            <Input
              id="price"
              type="number"
              value={settings.default_price}
              onChange={(e) => setSettings({ ...settings, default_price: parseFloat(e.target.value) || 10 })}
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              नए ग्राहक के लिए यह कीमत इस्तेमाल होगी
            </p>
          </div>
        </Card>

        {/* PIN Security */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            सुरक्षा
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pin-toggle">PIN सुरक्षा</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  ऐप खोलते समय PIN मांगें
                </p>
              </div>
              <Switch
                id="pin-toggle"
                checked={pinEnabled}
                onCheckedChange={setPinEnabled}
              />
            </div>
            
            {pinEnabled && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="pin">4 अंकों का PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                />
                <p className="text-xs text-muted-foreground">
                  याद रखें: यह PIN भूल जाने पर रिकवर नहीं हो सकता
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 gradient-chai text-lg font-semibold"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'सेव हो रहा है...' : 'सेव करें'}
        </Button>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>चाय खाता v1.0</p>
          <p className="mt-1">चाय विक्रेताओं के लिए सरल हिसाब</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
