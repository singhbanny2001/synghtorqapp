import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BrandWaveBackground from "@/components/BrandWaveBackground";
import { useAuth } from "@/context/AuthContext";

const LOGO_URL = '/syngh-torq-logo-electrolyte.png';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login } = useAuth();

  useEffect(() => {
    const clearAutofill = window.setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 100);
    return () => window.clearTimeout(clearAutofill);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    setTimeout(() => {
      const user = login(email, password);
      setIsLoading(false);
      if (!user) {
        setLoginError("Invalid email or password");
        return;
      }
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="flex min-h-full flex-col bg-surface-dark relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-0 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10 overflow-hidden flex-shrink-0">
        <BrandWaveBackground />
        <div className="relative z-10 px-6 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
          <div className="flex flex-col items-center">
            <div className="w-60 h-60 flex items-center justify-center -my-12">
              <img src={LOGO_URL} alt="SYNGH TORQ" className="w-full h-full object-contain mix-blend-screen" />
            </div>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 px-6 mt-6 flex-1">
        <div className="mx-auto w-full max-w-[380px] rounded-2xl border border-surface-border bg-surface-glass p-5 shadow-card backdrop-blur-xl">
          <h2 className="text-headline font-bold mb-4 text-text-primary">
            Sign in
          </h2>

        <form onSubmit={handleLogin} className="space-y-3.5" autoComplete="new-password">
          <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
          <input type="password" name="password" autoComplete="current-password" className="hidden" tabIndex={-1} aria-hidden="true" />
          <div>
            <label className="block text-caption font-medium mb-1.5 text-text-secondary">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ph ph-envelope text-text-tertiary" />
              </div>
              <input
                type="text"
                inputMode="email"
                name="fleet-access-id"
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginError("");
                }}
                placeholder="manager@synghtorq.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-body outline-none transition-all duration-200 bg-surface-card text-text-primary border border-surface-border placeholder-text-tertiary focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-caption font-medium mb-1.5 text-text-secondary">
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                <i className="ph ph-lock text-text-tertiary" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="fleet-access-key"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError("");
                }}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-3 rounded-xl text-body outline-none transition-all duration-200 bg-surface-card text-text-primary border border-surface-border placeholder-text-tertiary focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center"
              >
                <i className={`${showPassword ? "ph ph-eye-slash" : "ph ph-eye"} text-text-tertiary`} />
              </button>
            </div>
          </div>

          {loginError && (
            <div className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-caption text-danger">
              {loginError}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-surface-border bg-surface-card text-primary focus:ring-primary/30"
              />
              <span className="text-caption text-text-secondary">
                Remember me
              </span>
            </label>
            <button type="button" className="text-caption font-medium text-primary">
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl text-body-lg font-semibold text-white btn-press transition-all duration-200 ${
              isLoading
                ? "bg-primary/70 cursor-not-allowed"
                : "bg-primary hover:bg-primary-700 active:bg-primary-800 shadow-card"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ph ph-spinner animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        </div>

      </div>

      {/* Footer */}
      <div className="relative z-10 px-6 py-4 text-center flex-shrink-0">
        <p className="text-body-sm text-text-secondary">
          Don&apos;t have an account?{" "}
          <button onClick={() => navigate("/register")} className="font-semibold text-primary">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
}
