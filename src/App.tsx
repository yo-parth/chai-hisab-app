import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CustomerDetail from "./pages/CustomerDetail";
import Export from "./pages/Export";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { PinLock } from "./components/PinLock";
import { initEncryptionIfNeeded } from "./lib/db";
import { LanguageProvider } from "./lib/i18n";

const queryClient = new QueryClient();

const App = () => {
  const [pinRequired, setPinRequired] = useState<boolean | null>(null);

  useEffect(() => {
    initEncryptionIfNeeded().then((required) => {
      setPinRequired(required);
    });
  }, []);

  if (pinRequired === null) return null;

  if (pinRequired === true) {
    return (
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PinLock onUnlock={() => setPinRequired(false)} />
        </TooltipProvider>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/customer/:id" element={<CustomerDetail />} />
              <Route path="/export" element={<Export />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
};

export default App;
