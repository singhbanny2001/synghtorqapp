import React from 'react';
import { useAccount } from './AccountContext';

export function AccountSwitcher() {
  const { activeAccount, switchAccount, availableAccounts } = useAccount();

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = event.target.value;
    switchAccount(accountId);
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', margin: '1rem' }}>
      <h4>Account Switcher</h4>
      <p>
        Current Account: <strong>{activeAccount.name}</strong> ({activeAccount.role})
      </p>
      <select value={activeAccount.id} onChange={handleSelectChange} style={{ padding: '8px', fontSize: '1rem' }}>
        <option value="" disabled>
          Switch account...
        </option>
        {availableAccounts.map(account => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </div>
  );
}
