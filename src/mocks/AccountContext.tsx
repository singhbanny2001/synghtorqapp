/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type PropsWithChildren, useMemo } from 'react';
import { accounts, type Account } from '@/mocks/accountData';

// 1. Define the shape of the context data
interface AccountContextType {
  activeAccount: Account;
  switchAccount: (accountId: string) => void;
  availableAccounts: Account[];
}

// 2. Create the context with an undefined initial value
const AccountContext = createContext<AccountContextType | undefined>(undefined);

// 3. Create the Provider component that will wrap your app
export function AccountProvider({ children }: PropsWithChildren) {
  // Find the initially active account from mock data, or default to the first one
  const initialAccount = useMemo(() => accounts.find(acc => acc.isActive) || accounts[0], []);
  
  const [activeAccount, setActiveAccount] = useState<Account>(initialAccount);

  const switchAccount = (accountId: string) => {
    const newAccount = accounts.find(acc => acc.id === accountId);
    if (newAccount) {
      setActiveAccount(newAccount);
    } else {
      console.error(`Account with id ${accountId} not found.`);
    }
  };

  // The value that will be available to all children
  const value = {
    activeAccount,
    switchAccount,
    availableAccounts: accounts,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

// 4. Create a custom hook for easy consumption of the context
export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
