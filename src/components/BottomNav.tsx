import { Home, Settings, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-card">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center justify-center gap-1 transition-smooth ${
            isActive('/') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs font-medium">होम</span>
        </button>
        
        <button
          onClick={() => navigate('/export')}
          className={`flex flex-col items-center justify-center gap-1 transition-smooth ${
            isActive('/export') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Download className="w-5 h-5" />
          <span className="text-xs font-medium">एक्सपोर्ट</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center justify-center gap-1 transition-smooth ${
            isActive('/settings') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs font-medium">सेटिंग्स</span>
        </button>
      </div>
    </nav>
  );
};
