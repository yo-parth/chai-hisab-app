import { useEffect, useState } from 'react';
import { Customer, getCustomers, getCustomerBalance } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';

interface CustomerWithBalance extends Customer {
  cups: number;
  lastVisit: number;
}

export const CustomerList = ({ onAddCustomer }: { onAddCustomer: () => void }) => {
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const formatDate = (timestamp: number): string => {
    if (!timestamp) return t('never');
    const date = new Date(timestamp);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('todayDate');
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('daysAgo', { days: diffDays });
    return date.toLocaleDateString('hi-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {customers.length === 0 ? (
        <div className="text-center py-16">
          <Coffee className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">{t('noCustomers')}</h3>
          <p className="text-muted-foreground mb-6">{t('noCustomersHint')}</p>
        </div>
      ) : (
        customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-xl border border-border p-4 cursor-pointer hover:bg-black/5 transition-colors"
            onClick={() => navigate(`/customer/${customer.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                  <User className="w-5 h-5 text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[16px] font-medium text-[#1C0A00] truncate">{customer.name}</h3>
                  <p className="text-[12px] text-muted">
                    {t('lastVisit')}: {formatDate(customer.lastVisit)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[32px] font-medium leading-none ${customer.cups > 0 ? 'text-accent' : 'text-primary'}`}>
                  {customer.cups}
                </div>
                <div className="text-[11px] text-muted mt-0.5">{t('totalCupsLabel')}</div>
              </div>
            </div>
          </div>
        ))
      )}

      <Button
        onClick={onAddCustomer}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-[#68330F] text-white"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};
