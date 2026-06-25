import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import MobileShell from "@/components/MobileShell";
import { AccountProvider } from "@/mocks/AccountContext";

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <AccountProvider>
            <BrowserRouter basename={__BASE_PATH__}>
              <MobileShell>
                <AppRoutes />
              </MobileShell>
            </BrowserRouter>
          </AccountProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
