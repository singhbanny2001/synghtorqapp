/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Account } from '@/mocks/accountData';

interface AccountContextType {
  activeAccount: Account | null;
  switchAccount: (accountId: string) => void;
  availableAccounts: Account[];
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

function buildAccountFromUser(user: ReturnType<typeof useAuth>['user']): Account | null {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.companyName || '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'A')}&background=0084FF&color=fff`,
    isActive: true,
  };
}

export function AccountProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const activeAccount = useMemo(() => buildAccountFromUser(user), [user]);

  return (
    <AccountContext.Provider
      value={{
        activeAccount,
        switchAccount: () => {},
        availableAccounts: activeAccount ? [activeAccount] : [],
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
