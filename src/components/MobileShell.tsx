import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useEffect } from 'react';
import { type ReactNode } from 'react';
import { scheduleScrollAppToTop } from '@/utils/scrollToTop';

const HIDE_NAV_PATHS = ['/login', '/register', '/forgot-password'];
const RESET_SCROLL_PATHS = new Set([
  '/',
  '/dashboard',
  '/vehicles',
  '/playback',
  '/reports',
  '/services',
  '/expenses',
  '/more',
  '/devices',
  '/drivers',
  '/team',
  '/alerts',
]);

interface MobileShellProps {
  children: ReactNode;
}

export default function MobileShell({ children }: MobileShellProps) {
  const location = useLocation();
  const showNav = !HIDE_NAV_PATHS.includes(location.pathname);

  useEffect(() => {
    if (!RESET_SCROLL_PATHS.has(location.pathname)) return;
    return scheduleScrollAppToTop();
  }, [location.pathname]);

  return (
    <div className="app-viewport">
      <div className={`mobile-app-shell ${showNav ? 'with-nav' : 'auth-shell'}`}>
        {showNav && <BottomNav variant="sidebar" />}
        <main
          className={`app-main scroll-momentum hide-scrollbar ${showNav ? 'app-main-with-nav' : 'app-main-auth'}`}
        >
          {children}
        </main>
        {showNav && <BottomNav variant="bottom" />}
      </div>
    </div>
  );
}
