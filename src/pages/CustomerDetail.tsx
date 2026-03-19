import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Customer,
  Entry,
  getCustomer,
  getCustomerEntries,
  saveEntry,
  getCustomerBalance,
  deleteEntry,
} from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Coffee, CheckCircle2, Clock, MessageCircle, SplitSquareVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [balance, setBalance] = useState({ cups: 0, lastVisit: 0 });
  const [loading, setLoading] = useState(true);

  // Partial Payment State
  const [showPartialForm, setShowPartialForm] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');

  // ─── Undo state ─────────────────────────────────────────────────────────────
  const undoEntryId  = useRef<string | null>(null);
  const undoToastId  = useRef<string | number | null>(null);
  const undoInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const undoTimeout  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoState = () => {
    if (undoToastId.current !== null) toast.dismiss(undoToastId.current);
    if (undoInterval.current !== null) clearInterval(undoInterval.current);
    if (undoTimeout.current  !== null) clearTimeout(undoTimeout.current);
    undoEntryId.current  = null;
    undoToastId.current  = null;
    undoInterval.current = null;
    undoTimeout.current  = null;
  };

  const handleUndo = async () => {
    const eid = undoEntryId.current;
    clearUndoState();
    if (!eid) return;
    await deleteEntry(eid);
    toast.success(t('undone'));
    loadData();
  };

  const showUndoToast = (entryId: string, message: string) => {
    clearUndoState();
    undoEntryId.current = entryId;

    let secondsLeft = 10;

    const render = () => {
      const id = toast(message, {
        id: undoToastId.current ?? undefined,
        duration: Infinity,
        action: {
          label: t('undoAction', { seconds: secondsLeft }),
          onClick: handleUndo,
        },
      });
      if (undoToastId.current === null) undoToastId.current = id;
    };

    render();

    undoInterval.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        render();
      } else {
        clearUndoState();
      }
    }, 1000);

    undoTimeout.current = setTimeout(() => {
      clearUndoState();
    }, 10_000);
  };

  useEffect(() => () => clearUndoState(), []);

  // ─── Data loading ────────────────────────────────────────────────────────────

  const loadData = async () => {
    if (!id) return;

    const customerData = await getCustomer(id);
    if (!customerData) {
      toast.error(t('customerNotFound'));
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

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleAddChai = async () => {
    if (!id) return;

    const entry: Entry = {
      id: `entry_${Date.now()}`,
      customer_id: id,
      qty: 1,
      type: 'sale',
      timestamp: Date.now(),
    };

    await saveEntry(entry);
    loadData();
    showUndoToast(entry.id, t('chaiAdded'));
  };

  const handleSettlement = async () => {
    if (!id || balance.cups === 0) return;

    const entry: Entry = {
      id: `entry_${Date.now()}`,
      customer_id: id,
      qty: balance.cups,
      type: 'settlement',
      timestamp: Date.now(),
      note: t('settlementNote', { cups: balance.cups }),
    };

    await saveEntry(entry);
    loadData();
    showUndoToast(entry.id, t('paymentRecorded'));
  };

  const handlePartialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !customer) return;

    const amount = parseInt(partialAmount, 10);
    const totalAmount = balance.cups * (customer.price_per_cup || 10);

    if (isNaN(amount) || amount <= 0 || amount > totalAmount) return;

    const deductedCups = Math.floor(amount / (customer.price_per_cup || 10));

    const entry: Entry = {
      id: `entry_${Date.now()}`,
      customer_id: id,
      qty: deductedCups,
      type: 'partial',
      timestamp: Date.now(),
      note: t('partialPaidNote', { amount }),
    };

    await saveEntry(entry);
    setShowPartialForm(false);
    setPartialAmount('');
    loadData();
    showUndoToast(entry.id, t('paymentRecorded'));
  };

  const handleWhatsAppReminder = () => {
    if (!customer?.phone) return;
    const totalAmount = balance.cups * (customer.price_per_cup || 10);
    const message = t('whatsappMsg', {
      name: customer.name,
      cups: balance.cups,
      amount: totalAmount,
    });
    const url = `https://wa.me/91${customer.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ─── Formatting ──────────────────────────────────────────────────────────────

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (!customer) return null;

  const totalAmount = balance.cups * (customer.price_per_cup || 10);

  // Calculate sum of partial payments since last settlement
  let partialRupeesSinceSettlement = 0;
  let hasPartial = false;
  const lastSettlementIndex = entries.findIndex((e) => e.type === 'settlement');
  const activeEntries = lastSettlementIndex === -1 ? entries : entries.slice(0, lastSettlementIndex);

  for (const entry of activeEntries) {
    if (entry.type === 'partial' && entry.note) {
      // note contains the rendered partialPaidNote, which has the amount.
      // But it's easier to extract the amount directly from the note if we strictly know it's a number,
      // or we can calculate the amount by checking the stored string or reversing the Math.floor.
      // The requirement says "note: string (stores the rupee amount paid, e.g. "₹50")" but actually
      // the first requirement says: "note: string (stores the rupee amount paid, e.g. "₹50")"
      // Wait, in handlePartialSubmit I stored: note: t('partialPaidNote', { amount }) which translates to "₹50 आंशिक भुगतान हुआ".
      // To strictly adhere to "stores the rupee amount paid", let's extract the digits from the note.
      const match = entry.note.match(/\d+/);
      if (match) {
        partialRupeesSinceSettlement += parseInt(match[0], 10);
        hasPartial = true;
      }
    }
  }

  const pricePerCup = customer.price_per_cup || 10;
  const partialDeductedCups = parseInt(partialAmount, 10)
    ? Math.floor(parseInt(partialAmount, 10) / pricePerCup)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-primary p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="mb-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-[24px] font-semibold text-white">{customer.name}</h1>
          {hasPartial && balance.cups > 0 && (
            <span className="bg-[#FEF3C7] text-muted text-[11px] px-2 py-0.5 rounded-[20px]">
              {t('partialBadge')}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[80px] font-bold text-white leading-none">{balance.cups}</span>
          <span className="text-[18px] font-medium text-white/70">{t('cupsOwed', { cups: '' }).replace('{cups} ', '')}</span>
        </div>
        <div className="text-[15px] font-medium text-white/90 mt-1">
          {t('totalBalance', { amount: totalAmount, price: customer.price_per_cup || 10 })}
        </div>
        {hasPartial && balance.cups > 0 && (
          <div className="text-[14px] font-medium text-[#FCD34D] mt-0.5">
            {t('partialPaidNote', { amount: partialRupeesSinceSettlement })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 -mt-6">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleAddChai}
            className="flex flex-col items-center justify-center gap-1.5 h-[76px] bg-white border border-border rounded-xl active:bg-background transition-colors"
          >
            <Coffee className="w-[22px] h-[22px] text-primary" />
            <span className="text-[15px] font-medium text-primary">{t('addChai')}</span>
          </button>
          
          <button
            onClick={() => {
              setShowPartialForm(!showPartialForm);
              setPartialAmount('');
            }}
            disabled={balance.cups === 0}
            className="flex flex-col items-center justify-center gap-1.5 h-[76px] bg-white border border-border rounded-xl active:bg-background transition-colors disabled:opacity-50 disabled:active:bg-white"
          >
            <SplitSquareVertical className="w-[22px] h-[22px] text-primary" />
            <span className="text-[15px] font-medium text-primary">{t('partialPaymentBtn')}</span>
          </button>
          
          <button
            onClick={handleSettlement}
            disabled={balance.cups === 0}
            className="flex flex-col items-center justify-center gap-1.5 h-[76px] bg-white border border-border rounded-xl active:bg-background transition-colors disabled:opacity-50 disabled:active:bg-white"
          >
            <CheckCircle2 className="w-[22px] h-[22px] text-primary" />
            <span className="text-[15px] font-medium text-primary">{t('paymentDone')}</span>
          </button>
        </div>

        {/* Partial Payment Form Inline */}
        {showPartialForm && (
          <div className="mt-3 bg-white border border-border rounded-xl p-4">
            <form onSubmit={handlePartialSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-primary mb-1.5 block">
                  {t('partialAmountPrompt')}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    autoFocus
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder={`Max: ₹${totalAmount}`}
                    min="1"
                    max={totalAmount}
                    className="flex-1 bg-background border-border"
                  />
                  <Button 
                    type="submit" 
                    disabled={!partialAmount || parseInt(partialAmount, 10) <= 0 || parseInt(partialAmount, 10) > totalAmount}
                    className="bg-accent hover:bg-[#A3360A] text-white px-6"
                  >
                    {t('partialSubmitBtn')}
                  </Button>
                </div>
                {parseInt(partialAmount, 10) > 0 && (
                  <div className="text-[14px] text-accent font-medium mt-2 ml-1">
                    {t('partialCupsDeducted', { cups: partialDeductedCups })}
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* WhatsApp reminder */}
      {customer.phone && (
        <div className="px-4 mt-3">
          <button
            onClick={handleWhatsAppReminder}
            disabled={balance.cups === 0}
            className="w-full h-[52px] bg-white border border-border rounded-xl flex items-center justify-center text-[14px] text-emerald-600 font-medium active:bg-background transition-colors disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {t('whatsappReminder')}
          </button>
        </div>
      )}

      {/* History */}
      <div className="px-4 mt-6">
        <h2 className="text-[14px] font-semibold text-muted uppercase tracking-[0.04em] mb-3 px-1">
          {t('history')}
        </h2>
        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-6 text-center text-[14px] text-muted">
              {t('noTransactions')}
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-[10px] border border-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[15px] font-medium">
                      {entry.type === 'sale' ? (
                        <span className="text-primary">{t('saleLabel', { qty: entry.qty })}</span>
                      ) : entry.type === 'partial' ? (
                        <span className="text-accent">
                          {t('partialHistoryLabel', { amount: entry.note?.match(/\d+/)?.[0] || '0' })}
                        </span>
                      ) : (
                        <span className="text-emerald-600">{t('paymentLabel', { qty: entry.qty })}</span>
                      )}
                    </div>
                    {entry.type === 'partial' ? (
                      <div className="text-[13px] font-normal text-muted mt-0.5">
                        {t('partialHistoryDeducted', { cups: entry.qty })}
                      </div>
                    ) : entry.note && (
                      <div className="text-[13px] font-normal text-muted mt-0.5">{entry.note}</div>
                    )}
                    <div className="text-[12px] font-normal text-muted/60 mt-1.5">
                      {formatDateTime(entry.timestamp)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[15px] font-medium ${
                      entry.type === 'sale' ? 'text-primary' : 
                      entry.type === 'partial' ? 'text-accent' : 'text-emerald-600'
                    }`}>
                      ₹{entry.qty * (customer.price_per_cup || 10)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
