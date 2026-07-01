import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const LOGO_URL = '/syngh-torq-logo-electrolyte.png';

const featureItems = [
  { icon: 'ph ph-satellite', label: 'Real-time Tracking' },
  { icon: 'ph ph-shield-check', label: 'Secure & Reliable' },
  { icon: 'ph ph-chart-line-up', label: 'Smart Analytics' },
  { icon: 'ph ph-map-pin', label: 'Optimized Routes' },
] as const;

const insightCards = [
  { title: 'Total Units', value: '248', spark: true },
  { title: 'On Route', value: '85%', spark: false },
  { title: 'Live Tracking', value: 'Track your fleet in real-time', spark: false },
] as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !emailPattern.test(trimmedEmail) || !password.trim()) {
      setLoginError("Email or password is incorrect");
      return;
    }

    setIsLoading(true);
    const result = await login(trimmedEmail, password);
    setIsLoading(false);
    if (!result.user) {
      setLoginError(result.error || "Email or password is incorrect");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7fbff_44%,#eef4fb_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-6rem] top-[-7rem] h-72 w-72 rounded-full bg-[#cfe5ff]/40 blur-3xl" />
        <div className="absolute right-[-5rem] top-[10%] h-80 w-80 rounded-full bg-white/85 blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[8%] h-72 w-72 rounded-full bg-[#dfeaff]/55 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.72))]" />

        <svg className="absolute left-0 top-0 h-full w-full opacity-60" viewBox="0 0 1440 1200" fill="none" aria-hidden="true">
          <defs>
            <pattern id="login-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.6" fill="#9fbbea" fillOpacity="0.65" />
            </pattern>
            <pattern id="login-map-grid" width="18" height="18" patternUnits="userSpaceOnUse">
              <path d="M 18 0 L 0 18" stroke="#cfe0fb" strokeWidth="0.8" strokeOpacity="0.45" />
            </pattern>
            <linearGradient id="login-route" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ba3ff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#2f6fed" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1440" height="1200" fill="transparent" />
          <path d="M 0 100 C 160 60, 280 180, 420 120 S 720 40, 880 110 S 1160 180, 1440 70" stroke="#dfe9f9" strokeWidth="3" opacity="0.65" />
          <path d="M 0 1080 C 140 980, 230 1140, 380 1010 S 650 870, 860 990 S 1200 1130, 1440 930" stroke="#dfe9f9" strokeWidth="3" opacity="0.5" />
          <path d="M 70 180 C 140 120, 200 130, 220 210 C 240 290, 190 360, 185 450 C 180 540, 210 650, 165 760 C 120 870, 70 965, 40 1110" stroke="url(#login-route)" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 10" />
          <path d="M 960 140 C 1070 190, 1110 290, 1210 330 S 1340 410, 1440 360" stroke="url(#login-route)" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 10" />
          <path d="M 50 820 C 120 760, 140 640, 220 585 S 260 500, 330 430" stroke="url(#login-route)" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 10" />
          <circle cx="1210" cy="330" r="9" fill="#2f6fed" />
          <circle cx="330" cy="430" r="9" fill="#2f6fed" />
          <circle cx="70" cy="180" r="9" fill="#2f6fed" />
          <circle cx="165" cy="760" r="9" fill="#2f6fed" />
          <circle cx="70" cy="180" r="16" stroke="#2f6fed" strokeOpacity="0.18" strokeWidth="10" />
          <circle cx="165" cy="760" r="16" stroke="#2f6fed" strokeOpacity="0.18" strokeWidth="10" />
          <circle cx="1210" cy="330" r="16" stroke="#2f6fed" strokeOpacity="0.18" strokeWidth="10" />
          <circle cx="330" cy="430" r="16" stroke="#2f6fed" strokeOpacity="0.18" strokeWidth="10" />
          <rect x="0" y="0" width="240" height="240" fill="url(#login-dots)" opacity="0.35" />
          <rect x="1200" y="980" width="240" height="240" fill="url(#login-dots)" opacity="0.3" />
          <rect x="0" y="260" width="280" height="520" fill="url(#login-map-grid)" opacity="0.22" />
          <rect x="1110" y="0" width="330" height="520" fill="url(#login-map-grid)" opacity="0.18" />
          <path d="M 1120 50 C 1170 30, 1210 50, 1240 95 C 1270 140, 1278 190, 1260 230" stroke="#d9e6fa" strokeWidth="2" opacity="0.55" />
          <path d="M 1135 95 C 1190 110, 1240 105, 1285 140 C 1330 175, 1360 220, 1400 260" stroke="#d9e6fa" strokeWidth="2" opacity="0.5" />
          <path d="M 1128 190 C 1180 190, 1215 230, 1238 282 C 1260 334, 1295 360, 1348 395" stroke="#d9e6fa" strokeWidth="2" opacity="0.45" />
          <circle cx="1240" cy="95" r="9" fill="#2f6fed" />
          <circle cx="1238" cy="282" r="9" fill="#2f6fed" />
          <circle cx="1240" cy="95" r="16" stroke="#2f6fed" strokeOpacity="0.18" strokeWidth="10" />
          <circle cx="1238" cy="282" r="16" stroke="#2f6fed" strokeOpacity="0.18" strokeWidth="10" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-4 py-2 sm:px-6 lg:px-8 lg:py-4">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 lg:gap-6">
          <div className="flex w-full max-w-5xl flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-8">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <img
                src={LOGO_URL}
                alt="SYNGH TORQ"
                className="h-20 w-auto object-contain drop-shadow-[0_18px_35px_rgba(47,111,237,0.12)] sm:h-24 lg:h-36"
              />
              <p className="mt-2 hidden max-w-xl text-sm leading-6 text-slate-500 sm:block sm:text-base">
                Sign in to continue to your account and monitor your fleet in real time.
              </p>
            </div>

            <div className="hidden w-[200px] shrink-0 flex-col gap-3 xl:flex">
              <div className="rounded-[26px] border border-white/80 bg-white/90 p-3 shadow-[0_18px_40px_rgba(47,111,237,0.08)] backdrop-blur-xl">
                <p className="text-sm text-slate-500">Total Units</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-[#1f5de8]">248</p>
                <div className="mt-3 h-24 rounded-2xl bg-gradient-to-br from-[#e8f1ff] to-[#dbe8ff] p-2.5">
                  <svg viewBox="0 0 180 80" className="h-full w-full" aria-hidden="true">
                    <polyline
                      points="4,64 22,54 40,56 58,36 76,30 94,40 112,26 130,28 148,18 166,10"
                      fill="none"
                      stroke="#2f6fed"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {[[4,64],[22,54],[40,56],[58,36],[76,30],[94,40],[112,26],[130,28],[148,18],[166,10]].map(([cx, cy], index) => (
                      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index === 9 ? 4 : 3} fill="#2f6fed" />
                    ))}
                  </svg>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/90 p-3 text-center shadow-[0_18px_40px_rgba(47,111,237,0.08)] backdrop-blur-xl">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#e8f1ff] to-white shadow-inner">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-[7px] border-[#d9e5ff] border-t-[#2f6fed]">
                    <span className="text-xl font-bold text-[#1f5de8]">85%</span>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-500">On Route</p>
              </div>

              <div className="rounded-[26px] border border-white/80 bg-white/90 p-3 text-center shadow-[0_18px_40px_rgba(47,111,237,0.08)] backdrop-blur-xl">
                <p className="text-sm text-slate-500">Live Tracking</p>
                <div className="mx-auto mt-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2f6fed]">
                  <i className="ph ph-map-pin text-3xl" />
                </div>
                <p className="mt-2 text-sm leading-5 text-slate-600">Track your fleet in real-time</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[520px]">
            <div className="rounded-[30px] border border-white/90 bg-white/94 p-5 shadow-[0_24px_70px_rgba(29,78,216,0.12)] backdrop-blur-2xl sm:p-7">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf2ff] text-[#2f6fed] shadow-inner sm:h-20 sm:w-20">
                <i className="ph ph-user text-3xl sm:text-4xl" />
              </div>

              <div className="mt-4 text-center sm:mt-5">
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Welcome back
                </h2>
                <p className="mt-2 text-sm text-slate-500 sm:text-lg">
                  Sign in to continue to your account
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-5 space-y-4 sm:mt-7 sm:space-y-5" autoComplete="new-password">
                <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
                <input type="password" name="password" autoComplete="current-password" className="hidden" tabIndex={-1} aria-hidden="true" />

                <div className="space-y-2">
                  <label className="block text-base font-semibold text-slate-900 sm:text-lg">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <i className="ph ph-envelope text-xl sm:text-2xl" />
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
                      placeholder="testnew@gmail.com"
                      className="h-14 w-full rounded-2xl border border-[#d9e4f3] bg-white pl-14 pr-4 text-[16px] text-slate-900 outline-none transition focus:border-[#2f6fed] focus:ring-4 focus:ring-[#2f6fed]/10 sm:h-[66px] sm:text-[17px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-base font-semibold text-slate-900 sm:text-lg">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <i className="ph ph-lock-key text-xl sm:text-2xl" />
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
                      className="h-14 w-full rounded-2xl border border-[#d9e4f3] bg-white pl-14 pr-14 text-[16px] text-slate-900 outline-none transition focus:border-[#2f6fed] focus:ring-4 focus:ring-[#2f6fed]/10 sm:h-[66px] sm:text-[17px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    >
                      <i className={`${showPassword ? "ph ph-eye-slash" : "ph ph-eye"} text-xl sm:text-2xl`} />
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {loginError}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded-md border-[#c8d5e8] bg-white text-[#2f6fed] focus:ring-[#2f6fed]/20 sm:h-5 sm:w-5"
                    />
                    <span className="font-medium text-slate-900">Remember me</span>
                  </label>
                  <button type="button" className="font-semibold text-[#2f6fed] hover:text-[#1f5de8]">
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`mt-1 flex h-14 w-full items-center justify-center rounded-2xl text-[17px] font-semibold text-white shadow-[0_18px_30px_rgba(31,93,232,0.28)] transition active:scale-[0.99] sm:mt-2 sm:h-[72px] sm:text-[19px] ${
                    isLoading
                      ? 'bg-[#4a7cf0]/75 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2152d4] via-[#2f6fed] to-[#1b49c1] hover:brightness-105'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <i className="ph ph-spinner animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <i className="ph ph-sign-in text-2xl" />
                      Sign In
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="hidden text-center text-base text-slate-500 md:block">
            Don&apos;t have an account?{" "}
            <button onClick={() => navigate("/register")} className="font-semibold text-[#2f6fed] hover:text-[#1f5de8]">
              Sign Up
            </button>
          </p>
        </div>

        <div className="hidden gap-4 pb-2 md:grid md:grid-cols-2 xl:grid-cols-4">
          {featureItems.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-3 rounded-2xl border border-white/90 bg-white/80 px-4 py-3 shadow-[0_18px_40px_rgba(47,111,237,0.08)] backdrop-blur-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#2f6fed]">
                <i className={`${feature.icon} text-2xl`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{feature.label}</p>
                <p className="text-xs text-slate-500">Fleet management tools</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
