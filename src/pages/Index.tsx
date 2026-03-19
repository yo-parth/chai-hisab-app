import { useEffect, useState } from 'react';
import { CustomerList } from '@/components/CustomerList';
import { AddCustomerDialog } from '@/components/AddCustomerDialog';
import { BottomNav } from '@/components/BottomNav';
import { Card } from '@/components/ui/card';
import { Coffee, TrendingUp, IndianRupee, User } from 'lucide-react';
import { getSummaryStats, SummaryStats } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';

type Range = 'today' | 'week';

const EMPTY_STATS: SummaryStats = { cupsSold: 0, totalOwed: 0, topDebtors: [] };

const Index = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [range, setRange] = useState<Range>('today');
  const [stats, setStats] = useState<SummaryStats>(EMPTY_STATS);
  const [statsLoading, setStatsLoading] = useState(true);
  const { t } = useTranslation();

  const loadStats = async (r: Range) => {
    setStatsLoading(true);
    try {
      const s = await getSummaryStats(r);
      setStats(s);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats(range);
  }, [range, refreshKey]);

  const handleAddSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const topDebtor = stats.topDebtors[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary p-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Coffee className="w-8 h-8 text-white" />
          <h1 className="text-[22px] font-medium text-white">{t('appName')}</h1>
        </div>
        <p className="text-[13px] text-white/60">{t('tagline')}</p>
      </div>

      {/* Stats bar */}
      <div className="px-4 pt-4 pb-2 bg-background">
        {/* Today / This week toggle */}
        <div className="flex gap-1 mb-3 bg-white border border-border rounded-[24px] p-1 w-fit">
          <button
            onClick={() => setRange('today')}
            className={`px-4 py-1.5 rounded-[20px] text-sm font-medium transition-colors ${
              range === 'today'
                ? 'bg-primary text-white'
                : 'bg-transparent text-primary hover:bg-primary/5'
            }`}
          >
            {t('today')}
          </button>
          <button
            onClick={() => setRange('week')}
            className={`px-4 py-1.5 rounded-[20px] text-sm font-medium transition-colors ${
              range === 'week'
                ? 'bg-primary text-white'
                : 'bg-transparent text-primary hover:bg-primary/5'
            }`}
          >
            {t('thisWeek')}
          </button>
        </div>

        {/* Three metric cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-border rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] text-muted mb-1 font-medium">{t('todaySold')}</div>
            <div className={`text-[28px] font-medium text-primary leading-none ${statsLoading ? 'opacity-40' : ''}`}>
              {statsLoading ? '—' : stats.cupsSold}
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] text-muted mb-1 font-medium">{t('totalOwed')}</div>
            <div className={`text-[28px] font-medium text-accent leading-none ${statsLoading ? 'opacity-40' : ''}`}>
              {statsLoading ? '—' : `₹${stats.totalOwed}`}
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] text-muted mb-1 font-medium">{t('topDebtor')}</div>
            <div
              className={`text-[16px] font-medium text-[#1C0A00] leading-tight truncate ${statsLoading ? 'opacity-40' : ''}`}
              title={topDebtor?.name}
            >
              {statsLoading ? '—' : (topDebtor ? topDebtor.name : '—')}
            </div>
            {!statsLoading && topDebtor && (
              <div className="text-[11px] text-muted mt-0.5">{topDebtor.cups} {t('cups')}</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 pt-2">
        <CustomerList key={refreshKey} onAddCustomer={() => setShowAddDialog(true)} />
      </div>

      <AddCustomerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={handleAddSuccess}
      />

      <BottomNav />
    </div>
  );
};

export default Index;
