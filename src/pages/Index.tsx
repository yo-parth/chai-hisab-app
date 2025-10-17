import { useState } from 'react';
import { CustomerList } from '@/components/CustomerList';
import { AddCustomerDialog } from '@/components/AddCustomerDialog';
import { BottomNav } from '@/components/BottomNav';
import { Coffee } from 'lucide-react';

const Index = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-chai text-primary-foreground p-6 shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <Coffee className="w-8 h-8" />
          <h1 className="text-3xl font-bold">चाय खाता</h1>
        </div>
        <p className="text-sm opacity-90">सरल हिसाब किताब</p>
      </div>

      <div className="p-6">
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
