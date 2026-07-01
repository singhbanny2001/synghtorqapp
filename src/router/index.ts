import { Navigate, useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { Suspense, useEffect } from "react";
import { createElement } from "react";
import routes from "./config";
import { useAuth } from "@/context/AuthContext";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
  interface Window {
    REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
  }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
  navigateResolver = resolve;
});

export function AppRoutes() {
  const element = useRoutes(routes);
  const navigate = useNavigate();
  const location = useLocation();
  const { canAccessPath, isAuthenticated, isLoading } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    window.REACT_APP_NAVIGATE = navigate;
    navigateResolver(window.REACT_APP_NAVIGATE);
  });

  if (isLoading) {
    return createElement(BlankLoading);
  }

  if (!isAuthenticated && !isAuthPage) {
    return createElement(Navigate, { to: "/login", replace: true });
  }

  if (isAuthenticated && isAuthPage) {
    return createElement(Navigate, { to: "/dashboard", replace: true });
  }

  if (isAuthPage) {
    return createElement(Suspense, { fallback: createElement(BlankLoading) }, element);
  }

  if (!canAccessPath(location.pathname)) {
    return createElement(Navigate, { to: "/dashboard", replace: true });
  }
  return createElement(Suspense, { fallback: createElement(BlankLoading) }, element);
}

function BlankLoading() {
  return createElement("div", { className: "min-h-full bg-surface-dark" });
}
