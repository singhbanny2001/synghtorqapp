import React from 'react';
import { AccountProvider } from './AccountContext';
import { AccountSwitcher } from './AccountSwitcher';

// You can import other components that need account info here
// import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <AccountProvider>
      {/* The AccountSwitcher and any other components can now access the account context */}
      <header>
        <h1>Fleet Management</h1>
        <AccountSwitcher />
      </header>
      <main>{/* Your other components like Dashboard, Map, etc. go here */}</main>
    </AccountProvider>
  );
}

export default App;
