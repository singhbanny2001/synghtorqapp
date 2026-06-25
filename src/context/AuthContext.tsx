/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export const ROLES = ['manager', 'supervisor', 'viewer'] as const;
export type UserRole = (typeof ROLES)[number];

export type Permission =
  | 'view'
  | 'mutate'
  | 'manageUsers'
  | 'share'
  | 'settings'
  | 'immobiliser';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => AuthUser | null;
  switchUserAccount: (account: AuthUser) => void;
  logout: () => void;
  can: (permission: Permission) => boolean;
  canAccessPath: (path: string) => boolean;
  isViewer: boolean;
  isManager: boolean;
  isSupervisor: boolean;
}

const STORAGE_KEY = 'syngh-torq-user';

const roleLabels: Record<UserRole, string> = {
  manager: 'Manager',
  supervisor: 'Supervisor',
  viewer: 'Viewer',
};

const demoAccounts: Array<AuthUser & { password: string }> = [
  {
    id: 'u-manager',
    name: 'Alex Johnson',
    email: 'manager@synghtorq.com',
    role: 'manager',
    password: 'Manager@123',
  },
  {
    id: 'u-supervisor',
    name: 'Maria Santos',
    email: 'supervisor@synghtorq.com',
    role: 'supervisor',
    password: 'Supervisor@123',
  },
  {
    id: 'u-viewer',
    name: 'Fleet Viewer',
    email: 'viewer@synghtorq.com',
    role: 'viewer',
    password: 'Viewer@123',
  },
];

const routeAccess: Record<UserRole, string[]> = {
  manager: ['*'],
  supervisor: ['*'],
  viewer: [
    '/',
    '/dashboard',
    '/vehicles',
    '/vehicle',
    '/track',
    '/reports',
    '/alerts',
    '/playback',
    '/more',
    '/login',
    '/register',
  ],
};

function isRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ROLES.includes(value as UserRole);
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed.email || !isRole(parsed.role)) return null;
    return {
      id: parsed.id || `u-${parsed.role}`,
      name: parsed.name || roleLabels[parsed.role],
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

function hasPermission(role: UserRole, permission: Permission) {
  if (permission === 'view') return true;
  if (role === 'viewer') return false;
  if (permission === 'immobiliser') return role === 'manager';
  return true;
}

function hasPathAccess(role: UserRole, path: string) {
  const allowed = routeAccess[role];
  if (allowed.includes('*')) return true;
  return allowed.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`));
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());

  const value = useMemo<AuthContextValue>(() => {
    const login = (email: string, password: string) => {
      const nextUser = demoAccounts.find(
        (account) =>
          account.email === email.trim().toLowerCase() &&
          account.password === password,
      );
      if (!nextUser) return null;
      const { password: _password, ...userAccount } = nextUser;
      void _password;
      setUser(userAccount);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userAccount));
      return userAccount;
    };

    const logout = () => {
      setUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
    };

    const switchUserAccount = (account: AuthUser) => {
      setUser(account);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    };

    return {
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      login,
      switchUserAccount,
      logout,
      can: (permission) => Boolean(user) && hasPermission(user.role, permission),
      canAccessPath: (path) => Boolean(user) && hasPathAccess(user.role, path),
      isViewer: user?.role === 'viewer',
      isManager: user?.role === 'manager',
      isSupervisor: user?.role === 'supervisor',
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function getRoleLabel(role: UserRole) {
  return roleLabels[role];
}
