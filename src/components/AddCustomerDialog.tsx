import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveCustomer } from '@/lib/db';
import { toast } from 'sonner';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddCustomerDialog = ({ open, onOpenChange, onSuccess }: AddCustomerDialogProps) => {
  const [name, setName] = useState('');
  const [pricePerCup, setPricePerCup] = useState('10');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('कृपया नाम दर्ज करें');
      return;
    }

    setSaving(true);
    try {
      const customer = {
        id: `customer_${Date.now()}`,
        name: name.trim(),
        price_per_cup: parseFloat(pricePerCup) || 10,
        created_at: Date.now()
      };

      await saveCustomer(customer);
      toast.success('ग्राहक जोड़ा गया');
      setName('');
      setPricePerCup('10');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error('कुछ गलत हुआ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">नया ग्राहक जोड़ें</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">नाम *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ग्राहक का नाम"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">प्रति कप कीमत (₹)</Label>
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
              className="flex-1"
            >
              रद्द करें
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 gradient-chai">
              {saving ? 'जोड़ रहे हैं...' : 'जोड़ें'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
