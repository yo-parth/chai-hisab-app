import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { Download, FileText } from 'lucide-react';
import { exportToCSV } from '@/lib/db';
import { toast } from 'sonner';

export default function Export() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportToCSV();
      
      // Create blob and download
      const blob = new Blob(["\uFEFF", csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `chai-khata-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('फाइल डाउनलोड हो रही है');
    } catch (error) {
      toast.error('एक्सपोर्ट नहीं हो सका');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-chai text-primary-foreground p-6 shadow-card">
        <h1 className="text-2xl font-bold">एक्सपोर्ट</h1>
        <p className="text-sm opacity-90 mt-1">अपना डेटा CSV में डाउनलोड करें</p>
      </div>

      <div className="p-6 pb-24">
        <Card className="p-6">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">CSV फाइल</h2>
            <p className="text-muted-foreground mb-6">
              सभी ग्राहकों और लेन-देन का विवरण CSV फाइल में डाउनलोड करें। 
              इसे Excel या Google Sheets में खोल सकते हैं।
            </p>
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="gradient-chai w-full h-12 text-lg font-semibold"
            >
              <Download className="w-5 h-5 mr-2" />
              {exporting ? 'तैयार हो रहा है...' : 'डाउनलोड करें'}
            </Button>
          </div>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">CSV फाइल में क्या होगा:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• ग्राहक का नाम</li>
            <li>• कप संख्या</li>
            <li>• प्रकार (बिक्री/भुगतान)</li>
            <li>• टिप्पणी</li>
            <li>• तारीख और समय</li>
          </ul>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
