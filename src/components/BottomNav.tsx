import { Home, Settings, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E7D5C5]">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center gap-1 transition-smooth ${
            isActive('/') ? 'text-accent' : 'text-muted/50'
          }`}
        >
          <Home className="w-[22px] h-[22px]" />
          <span className="text-[11px] font-medium">{t('navHome')}</span>
        </button>

        <button
          onClick={() => navigate('/export')}
          className={`flex flex-col items-center justify-center gap-1 transition-smooth ${
            isActive('/export') ? 'text-accent' : 'text-muted/50'
          }`}
        >
          <Download className="w-[22px] h-[22px]" />
          <span className="text-[11px] font-medium">{t('navExport')}</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center justify-center gap-1 transition-smooth ${
            isActive('/settings') ? 'text-accent' : 'text-muted/50'
          }`}
        >
          <Settings className="w-[22px] h-[22px]" />
          <span className="text-[11px] font-medium">{t('navSettings')}</span>
        </button>
      </div>
    </nav>
  );
};
