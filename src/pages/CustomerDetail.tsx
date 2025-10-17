import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Entry, getCustomer, getCustomerEntries, saveEntry, getCustomerBalance } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Coffee, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [balance, setBalance] = useState({ cups: 0, lastVisit: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!id) return;
    
    const customerData = await getCustomer(id);
    if (!customerData) {
      toast.error('ग्राहक नहीं मिला');
      navigate('/');
      return;
    }

    const entriesData = await getCustomerEntries(id);
    const balanceData = await getCustomerBalance(id);

    setCustomer(customerData);
    setEntries(entriesData);
    setBalance(balanceData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAddChai = async () => {
    if (!id) return;

    const entry: Entry = {
      id: `entry_${Date.now()}`,
      customer_id: id,
      qty: 1,
      type: 'sale',
      timestamp: Date.now()
    };

    await saveEntry(entry);
    toast.success('चाय जोड़ी गई');
    loadData();
  };

  const handleSettlement = async () => {
    if (!id || balance.cups === 0) return;

    const entry: Entry = {
      id: `entry_${Date.now()}`,
      customer_id: id,
      qty: balance.cups,
      type: 'settlement',
      timestamp: Date.now(),
      note: `${balance.cups} कप का भुगतान`
    };

    await saveEntry(entry);
    toast.success('भुगतान हो गया');
    loadData();
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">लोड हो रहा है...</div>
      </div>
    );
  }

  if (!customer) return null;

  const totalAmount = balance.cups * (customer.price_per_cup || 10);

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="gradient-chai text-primary-foreground p-6 shadow-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="mb-4 text-primary-foreground hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold mb-2">{customer.name}</h1>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{balance.cups}</span>
          <span className="text-xl">कप बाकी</span>
        </div>
        <div className="text-sm opacity-90 mt-1">
          कुल: ₹{totalAmount} ({customer.price_per_cup || 10}/कप)
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 -mt-4 flex gap-3">
        <Button
          onClick={handleAddChai}
          className="flex-1 h-14 gradient-chai shadow-card text-lg font-semibold"
        >
          <Coffee className="w-5 h-5 mr-2" />
          चाय जोड़ें
        </Button>
        <Button
          onClick={handleSettlement}
          disabled={balance.cups === 0}
          variant="outline"
          className="flex-1 h-14 bg-card shadow-card text-lg font-semibold"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          भुगतान किया
        </Button>
      </div>

      {/* History */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          इतिहास
        </h2>
        <div className="space-y-3">
          {entries.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              अभी तक कोई लेन-देन नहीं
            </Card>
          ) : (
            entries.map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">
                      {entry.type === 'sale' ? (
                        <span className="text-primary">+{entry.qty} कप</span>
                      ) : (
                        <span className="text-accent">भुगतान: {entry.qty} कप</span>
                      )}
                    </div>
                    {entry.note && (
                      <div className="text-sm text-muted-foreground mt-1">{entry.note}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(entry.timestamp)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₹{entry.qty * (customer.price_per_cup || 10)}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
