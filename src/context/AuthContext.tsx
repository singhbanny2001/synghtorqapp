/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';
import { clearLiveFleetSnapshot, refreshLiveFleetSnapshot } from '@/utils/liveFleet';
import { resetFleetDebugState, setFleetDebugState } from '@/utils/debugFleet';

export const ROLES = ['company_owner', 'manager', 'supervisor', 'viewer'] as const;
export type UserRole = (typeof ROLES)[number];
type BackendRole = UserRole | 'super_admin' | 'dealer' | 'dispatcher' | 'admin';

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
  companyId?: string | null;
  companyName?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ user: AuthUser | null; timedOut: boolean; error: string | null }>;
  switchUserAccount: (account: AuthUser) => void;
  logout: () => void;
  can: (permission: Permission) => boolean;
  canAccessPath: (path: string) => boolean;
  isViewer: boolean;
  isManager: boolean;
  isSupervisor: boolean;
}

const roleLabels: Record<UserRole, string> = {
  company_owner: 'Company Owner',
  manager: 'Manager',
  supervisor: 'Supervisor',
  viewer: 'Viewer',
};

const SESSION_STORAGE_KEY = 'syngh-auth-session';
const USER_STORAGE_KEY = 'syngh-auth-user';
const SUPABASE_PROJECT_REF = (() => {
  try {
    return new URL(import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '').hostname.split('.')[0];
  } catch {
    return '';
  }
})();
const COMPANY_OWNER_EMAIL_OVERRIDES = new Set(['testnew@gmail.com']);
const ACCOUNT_DISPLAY_NAME_OVERRIDES = new Map<string, string>([
  ['testnew@gmail.com', 'test'],
]);
const LEGACY_SUPABASE_STORAGE_KEYS = [
  SUPABASE_PROJECT_REF ? `sb-${SUPABASE_PROJECT_REF}-auth-token` : '',
  'sb-auth-token',
  'sb-refresh-token',
  'sb-access-token',
  'supabase.auth.token',
].filter(Boolean);

const routeAccess: Record<UserRole, string[]> = {
  company_owner: ['*'],
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
    '/devices',
    '/login',
    '/register',
  ],
};

function isRole(value: unknown): value is UserRole {
  return typeof value === 'string' && ROLES.includes(value as UserRole);
}

function normalizeRole(value: unknown): UserRole {
  const role = String(value || '').toLowerCase().trim() as BackendRole;
  if (role === 'company_owner' || role === 'super_admin' || role === 'admin') {
    return 'company_owner';
  }
  if (role === 'manager') {
    return 'manager';
  }
  if (role === 'dealer' || role === 'dispatcher' || role === 'supervisor') {
    return 'supervisor';
  }
  return 'viewer';
}

function resolveAccountRole(email: string | null | undefined, roleValue: unknown): UserRole {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (COMPANY_OWNER_EMAIL_OVERRIDES.has(normalizedEmail)) {
    return 'company_owner';
  }
  return normalizeRole(roleValue);
}

function resolveAccountDisplayName(email: string | null | undefined, fallbackName: string | null | undefined, fallbackRole: UserRole) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return ACCOUNT_DISPLAY_NAME_OVERRIDES.get(normalizedEmail) || fallbackName || email || roleLabels[fallbackRole];
}

function hasPermission(role: UserRole, permission: Permission) {
  if (permission === 'view') return true;
  if (role === 'viewer') return false;
  if (permission === 'immobiliser') return role === 'manager' || role === 'company_owner';
  return true;
}

function hasPathAccess(role: UserRole, path: string) {
  const allowed = routeAccess[role];
  if (allowed.includes('*')) return true;
  return allowed.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`));
}

function buildSessionUser(authUser: SupabaseUser): AuthUser {
  const metadataRole = authUser.user_metadata?.role;
  const role = resolveAccountRole(authUser.email, metadataRole);

  return {
    id: authUser.id,
    name: resolveAccountDisplayName(authUser.email, authUser.user_metadata?.full_name, role),
    email: authUser.email || '',
    role,
    companyId: null,
    companyName: null,
  };
}

function buildAuthUserFromProfile(params: {
  id: string;
  email: string;
  fullName?: string | null;
  role?: unknown;
  companyId?: string | null;
  companyName?: string | null;
}): AuthUser {
  const role = resolveAccountRole(params.email, params.role);

  return {
    id: params.id,
    name: resolveAccountDisplayName(params.email, params.fullName, role),
    email: params.email,
    role,
    companyId: params.companyId ?? null,
    companyName: params.companyName ?? null,
  };
}

function readStoredAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AuthUser> | null;
    if (!parsed?.email || !isRole(parsed.role)) return null;

    const role = COMPANY_OWNER_EMAIL_OVERRIDES.has(parsed.email.trim().toLowerCase())
      ? 'company_owner'
      : parsed.role;

    return {
      id: parsed.id || `u-${parsed.role}`,
      name: resolveAccountDisplayName(parsed.email, parsed.name, role),
      email: parsed.email,
      role,
      companyId: parsed.companyId ?? null,
      companyName: parsed.companyName ?? null,
    };
  } catch {
    return null;
  }
}

function persistAuthUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;

  try {
    if (!user) {
      window.localStorage.removeItem(USER_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId ?? null,
        companyName: user.companyName ?? null,
      }),
    );
  } catch {
    // Ignore storage errors so auth still works in restricted browsers.
  }
}

function clearStoredAuthSession() {
  if (typeof window === 'undefined') return;

  const removeAuthKeys = (storage: Storage) => {
    try {
      storage.removeItem(SESSION_STORAGE_KEY);
      storage.removeItem(USER_STORAGE_KEY);
      LEGACY_SUPABASE_STORAGE_KEYS.forEach((key) => storage.removeItem(key));

      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const key = storage.key(index);
        if (!key) continue;
        if (
          key === SESSION_STORAGE_KEY ||
          key === USER_STORAGE_KEY ||
          key === 'supabase.auth.token' ||
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth-token')
        ) {
          storage.removeItem(key);
        }
      }
    } catch {
      // Ignore storage errors so logout still completes in restricted browsers.
    }
  };

  removeAuthKeys(window.localStorage);
  removeAuthKeys(window.sessionStorage);
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function signInWithPasswordTimeout(email: string, password: string, timeoutMs = 45000) {
  const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Email or password is incorrect');
    }

    const payload = await response.json() as { access_token?: string; refresh_token?: string };
    if (!payload.access_token || !payload.refresh_token) {
      throw new Error('Unable to start live session. Please try again.');
    }

    const sessionResult = await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    });

    if (sessionResult.error || !sessionResult.data.user) {
      throw new Error(sessionResult.error?.message || 'Unable to start live session. Please try again.');
    }

    return sessionResult as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Sign in request timed out. Please check the connection and try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function waitForRestoredSession(maxAttempts = 40) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (error) lastError = error;
    if (data.session?.user) {
      return { session: data.session, error: null };
    }
    await delay(150);
  }

  return { session: null, error: lastError };
}

async function loadCurrentUser(authUser: SupabaseUser | null): Promise<AuthUser | null> {
  if (!authUser) return null;

  const { data: profileByAuthUser, error: profileAuthUserError } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('auth_user_id', authUser.id)
    .maybeSingle();

  if (profileAuthUserError) {
    console.warn('[Auth] Failed to load user profile by auth_user_id:', profileAuthUserError.message);
  }

  const { data: profileByEmail, error: profileEmailError } = !profileByAuthUser && authUser.email
    ? await supabase
        .from('users')
        .select('id, full_name, email, role')
        .eq('email', authUser.email)
        .maybeSingle()
    : { data: null, error: null };

  if (profileEmailError) {
    console.warn('[Auth] Failed to load user profile by email:', profileEmailError.message);
  }

  const profile = profileByAuthUser || profileByEmail;

  const userId = profile?.id || authUser.id;
  const profileRole = resolveAccountRole(authUser.email, profile?.role);

  const companyUsersUserIdResp = await supabase
    .from('company_users')
    .select('company_id, role, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const employeeLinksUserIdResp = await supabase
    .from('employee_user_links')
    .select('company_id, employee_id, status')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const companyUsersRow = companyUsersUserIdResp.data ?? null;
  const employeeLinksRow = employeeLinksUserIdResp.data ?? null;
  const companyRow = companyUsersRow || employeeLinksRow;

  const companyNameResp = companyRow?.company_id
    ? await supabase.from('companies').select('company_name').eq('id', companyRow.company_id).maybeSingle()
    : { data: null, error: null };
  const companyName = companyNameResp?.data?.company_name ?? null;
  const companyRole = String(companyUsersRow?.role || '').toLowerCase();
  const membershipRole = ['owner', 'company_owner', 'admin'].includes(companyRole)
    ? 'company_owner'
    : companyRole === 'manager'
      ? 'manager'
    : profileRole;

  const usersCountResp = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('auth_user_id', authUser.id);
  const companyUsersCountResp = await supabase.from('company_users').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  const employeeLinksCountResp = await supabase.from('employee_user_links').select('id', { count: 'exact', head: true }).eq('user_id', userId);

  const companyUsersCount = companyUsersCountResp.count ?? 0;
  const employeeUserLinksCount = employeeLinksCountResp.count ?? 0;

  setFleetDebugState({
    userEmail: profile?.email || authUser.email || null,
    authUserId: authUser.id,
    resolvedCompanyId: companyRow?.company_id ?? null,
    companyName,
    usersCount: usersCountResp.count ?? 0,
    companyUsersCount,
    employeeUserLinksCount,
    source: 'auth-context',
  });

  return buildAuthUserFromProfile({
    id: userId,
    email: profile?.email || authUser.email || '',
    fullName: profile?.full_name,
    role: membershipRole,
    companyId: companyRow?.company_id ?? null,
    companyName,
  });
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredAuthUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const { session, error } = await waitForRestoredSession();
        if (error) {
          console.warn('[Auth] Failed to restore session:', error instanceof Error ? error.message : error);
        }

        const sessionUser = session?.user ?? null;
        if (sessionUser) {
          const trustedStoredUser = readStoredAuthUser();
          const immediateUser = (
            trustedStoredUser && trustedStoredUser.id === sessionUser.id
              ? trustedStoredUser
              : buildSessionUser(sessionUser)
          );
          if (!cancelled) {
            setUser(immediateUser);
            persistAuthUser(immediateUser);
            setIsLoading(false);
          }

          void Promise.all([
            loadCurrentUser(sessionUser).catch((error) => {
              console.warn('[Auth] Bootstrap profile load failed:', error);
              return null;
            }),
            refreshLiveFleetSnapshot({ force: true }),
          ]).then(([nextUser]) => {
            if (!cancelled && nextUser) {
              setUser(nextUser);
              persistAuthUser(nextUser);
            }
          });
        } else {
          clearStoredAuthSession();
          persistAuthUser(null);
          resetFleetDebugState();
          if (!cancelled) {
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (bootstrapError) {
        console.warn('[Auth] Bootstrap failed:', bootstrapError);
        clearStoredAuthSession();
        resetFleetDebugState();
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        try {
          if (_event === 'SIGNED_OUT') {
            clearStoredAuthSession();
            clearLiveFleetSnapshot();
            resetFleetDebugState();
            if (!cancelled) {
              setUser(null);
              setIsLoading(false);
            }
            return;
          }

          const sessionUser = session?.user ?? null;
          if (sessionUser) {
            if (!cancelled) {
              const trustedStoredUser = readStoredAuthUser();
              const immediateUser = (
                trustedStoredUser && trustedStoredUser.id === sessionUser.id
                  ? trustedStoredUser
                  : buildSessionUser(sessionUser)
              );
              setUser(immediateUser);
              persistAuthUser(immediateUser);
              setIsLoading(false);
            }

            void loadCurrentUser(sessionUser)
              .then((nextUser) => {
                if (!cancelled && nextUser) {
                  setUser(nextUser);
                  persistAuthUser(nextUser);
                }
              })
              .catch((error) => {
                console.warn('[Auth] Session profile load failed:', error);
              })
              .finally(() => {
                if (!cancelled) {
                  void refreshLiveFleetSnapshot({ force: true });
                }
              });
          }
        } catch (authError) {
          console.warn('[Auth] Session update failed:', authError);
          if (!cancelled) {
            setUser(null);
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const login = async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      let authResult: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

      try {
        authResult = await signInWithPasswordTimeout(normalizedEmail, password, 45000);
      } catch (error) {
        console.warn('[Auth] Sign in request failed:', error);
        setIsLoading(false);
        return {
          user: null,
          timedOut: false,
          error: error instanceof Error ? error.message : 'Unable to sign in. Please try again.',
        };
      }

      const { data, error } = authResult;
      const errorMessage =
        typeof error === 'string'
          ? error
          : error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : null;

      if (error || !data.user) {
        console.warn('[Auth] Sign in failed:', errorMessage || 'Unknown error');
        clearStoredAuthSession();
        clearLiveFleetSnapshot();
        resetFleetDebugState();
        setUser(null);
        return {
          user: null,
          timedOut: false,
          error: 'Email or password is incorrect',
        };
      }

      const sessionUser = buildSessionUser(data.user);
      setUser(sessionUser);
      persistAuthUser(sessionUser);
      setIsLoading(false);

      void loadCurrentUser(data.user)
        .then((nextUser) => {
          if (nextUser) {
            setUser(nextUser);
            persistAuthUser(nextUser);
          }
        })
        .catch((loadError) => {
          console.warn('[Auth] Post-login profile load failed:', loadError);
        })
        .finally(() => {
          window.setTimeout(() => void refreshLiveFleetSnapshot({ force: true }), 0);
        });

      return {
        user: sessionUser,
        timedOut: false,
        error: null,
      };
    };

    const logout = () => {
      setUser(null);
      setIsLoading(false);
      clearStoredAuthSession();
      clearLiveFleetSnapshot();
      resetFleetDebugState();
      void supabase.auth.signOut({ scope: 'local' }).finally(() => {
        clearStoredAuthSession();
      });
    };

    const switchUserAccount = (account: AuthUser) => {
      setUser(account);
    };

    return {
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      switchUserAccount,
      logout,
      can: (permission) => Boolean(user) && hasPermission(user.role, permission),
      canAccessPath: (path) => Boolean(user) && hasPathAccess(user.role, path),
      isViewer: user?.role === 'viewer',
      isManager: user?.role === 'manager' || user?.role === 'company_owner',
      isSupervisor: user?.role === 'supervisor',
    };
  }, [user, isLoading]);

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
