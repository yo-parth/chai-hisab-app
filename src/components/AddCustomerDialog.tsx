import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveCustomer } from '@/lib/db';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddCustomerDialog = ({ open, onOpenChange, onSuccess }: AddCustomerDialogProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pricePerCup, setPricePerCup] = useState('10');
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t('pleaseEnterName'));
      return;
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      toast.error(t('phoneMustBe10'));
      return;
    }

    setSaving(true);
    try {
      const customer = {
        id: `customer_${Date.now()}`,
        name: name.trim(),
        phone: phone.trim() || undefined,
        price_per_cup: parseFloat(pricePerCup) || 10,
        created_at: Date.now(),
      };

      await saveCustomer(customer);
      toast.success(t('customerAdded'));
      setName('');
      setPhone('');
      setPricePerCup('10');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(t('somethingWrong'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('addNewCustomer')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('nameLabel')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t('whatsappLabel')}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder={t('phonePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{t('pricePerCupLabel')}</Label>
            <Input
              id="price"
              type="number"
              value={pricePerCup}
              onChange={(e) => setPricePerCup(e.target.value)}
              placeholder="10"
              min="1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-white border-border hover:bg-black/5"
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-primary text-white hover:bg-[#68330F]">
              {saving ? t('adding') : t('add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
