import { useEffect, useState } from 'react';
import { Customer, getCustomers, getCustomerBalance } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomerWithBalance extends Customer {
  cups: number;
  lastVisit: number;
}

export const CustomerList = ({ onAddCustomer }: { onAddCustomer: () => void }) => {
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCustomers = async () => {
    const allCustomers = await getCustomers();
    const withBalances = await Promise.all(
      allCustomers.map(async (customer) => {
        const balance = await getCustomerBalance(customer.id);
        return { ...customer, ...balance };
      })
    );
    setCustomers(withBalances);
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'कभी नहीं';
    const date = new Date(timestamp);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'आज';
    if (diffDays === 1) return 'कल';
    if (diffDays < 7) return `${diffDays} दिन पहले`;
    return date.toLocaleDateString('hi-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">लोड हो रहा है...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {customers.length === 0 ? (
        <div className="text-center py-16">
          <Coffee className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">कोई ग्राहक नहीं</h3>
          <p className="text-muted-foreground mb-6">नया ग्राहक जोड़ने के लिए नीचे बटन दबाएं</p>
        </div>
      ) : (
        customers.map((customer) => (
          <Card
            key={customer.id}
            className="p-4 cursor-pointer hover:shadow-card transition-smooth"
            onClick={() => navigate(`/customer/${customer.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    आखिरी विज़िट: {formatDate(customer.lastVisit)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{customer.cups}</div>
                <div className="text-xs text-muted-foreground">कुल कप</div>
              </div>
            </div>
          </Card>
        ))
      )}

      <Button
        onClick={onAddCustomer}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg gradient-chai"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};
