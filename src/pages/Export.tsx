import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { Download, FileText } from 'lucide-react';
import { exportToCSV } from '@/lib/db';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export default function Export() {
  const [exporting, setExporting] = useState(false);
  const { t } = useTranslation();

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportToCSV();

      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `chai-khata-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(t('fileDownloading'));
    } catch (error) {
      toast.error(t('exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary p-6">
        <h1 className="text-[22px] font-medium text-white">{t('exportTitle')}</h1>
        <p className="text-[13px] text-white/60">{t('exportSubtitle')}</p>
      </div>

      <div className="p-4 pb-24">
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-[18px] font-medium mb-2">{t('csvFileTitle')}</h2>
            <p className="text-[13px] text-muted mb-6">{t('csvDescription')}</p>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="bg-primary text-white w-full h-12 text-[14px] font-medium rounded-xl border border-border hover:bg-[#68330F]"
            >
              <Download className="w-5 h-5 mr-2" />
              {exporting ? t('preparing') : t('download')}
            </Button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">{t('csvContains')}</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• {t('csvCustomerName')}</li>
            <li>• {t('csvCups')}</li>
            <li>• {t('csvType')}</li>
            <li>• {t('csvNote')}</li>
            <li>• {t('csvDate')}</li>
          </ul>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
