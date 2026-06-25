import {
  BarChart3,
  CarFront,
  Gauge,
  MoreHorizontal,
  PlayCircle,
  Wrench,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { scheduleScrollAppToTop } from '@/utils/scrollToTop';

type NavVariant = 'bottom' | 'sidebar';

const LOGO_URL = '/syngh-torq-logo-electrolyte.png';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Gauge },
  { path: '/vehicles', label: 'Vehicles', icon: CarFront },
  { path: '/playback', label: 'Playback', icon: PlayCircle },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/services', label: 'Reminders', icon: Wrench },
  { path: '/more', label: 'More', icon: MoreHorizontal },
];

interface BottomNavProps {
  variant?: NavVariant;
}

export default function BottomNav({ variant = 'bottom' }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessPath } = useAuth();
  const allowedNavItems = navItems.filter((item) => canAccessPath(item.path));

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/' || location.pathname === '/dashboard';
    if (path === '/services') return location.pathname === '/services';
    return location.pathname.startsWith(path);
  };

  const openTab = (path: string) => {
    navigate(path);
    scheduleScrollAppToTop();
  };

  if (variant === 'sidebar') {
    return (
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand-mark app-brand-logo">
            <img src={LOGO_URL} alt="SYNGH TORQ" />
          </div>
          <div>
            <p className="app-brand-title">Syngh Fleet</p>
            <p className="app-brand-subtitle">Command Center</p>
          </div>
        </div>
        <nav className="app-sidebar-nav" aria-label="Primary navigation">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => openTab(item.path)}
                className={`app-sidebar-link ${active ? 'is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={2.2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="app-sidebar-footer">
          <p>Fleet health</p>
          <strong>94%</strong>
          <span>24 assets monitored</span>
        </div>
      </aside>
    );
  }

  return (
    <nav className="app-bottom-nav" aria-label="Primary navigation">
      <div
        className="app-bottom-nav-inner"
        style={{ gridTemplateColumns: `repeat(${allowedNavItems.length}, minmax(0, 1fr))` }}
      >
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => openTab(item.path)}
              className={`app-bottom-link ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.6 : 2.1} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
