import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authService } from '../services/auth';

/* ------------------------------------------------------------------ */
/* Demo accounts — keep in sync with backend/seed_demo.py             */
/* ------------------------------------------------------------------ */
const DEMO_ACCOUNTS = [
  {
    role: 'Central Command',
    user: 'demo_command',
    pw: 'password123',
    desc: 'All stations, alerts & incidents',
    icon: 'hub',
    recommended: true,
  },
  {
    role: 'Station Leader',
    user: 'demo_station',
    pw: 'password123',
    desc: 'Station stock, people & operations',
    icon: 'home_work',
    recommended: false,
  },
  {
    role: 'Field Member',
    user: 'demo_field',
    pw: 'password123',
    desc: 'Field view & emergency SOS',
    icon: 'person_pin_circle',
    recommended: false,
  },
];

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const AUTO_LOGIN = import.meta.env.VITE_DEMO_AUTOLOGIN === 'true';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [loginHighlight, setLoginHighlight] = useState(false);

  const navigate = useNavigate();
  const loginBtnRef = useRef(null);
  const ariaLiveRef = useRef(null);

  const handleUsernameChange = useCallback((e) => {
    setUsername(e.target.value);
    setLoginHighlight(false);
    setSelectedDemo(null);
  }, []);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    setLoginHighlight(false);
    setSelectedDemo(null);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      navigate('/dashboard');
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          requestError.response?.data?.error ||
          'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  const performAutoLogin = useCallback(
    async (u, p) => {
      setError('');
      setLoading(true);

      try {
        await authService.login(u, p);
        navigate('/dashboard');
      } catch (requestError) {
        setError(
          requestError.response?.data?.detail ||
            requestError.response?.data?.error ||
            'Login failed'
        );
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleDemoSelect = useCallback(
    (acct) => {
      setUsername(acct.user);
      setPassword(acct.pw);
      setError('');
      setSelectedDemo(acct.user);
      setLoginHighlight(true);

      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent =
          `${acct.role} selected. Credentials filled. Press Login to continue.`;
      }

      if (AUTO_LOGIN) {
        performAutoLogin(acct.user, acct.pw);
        return;
      }

      setTimeout(() => {
        loginBtnRef.current?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth',
          block: 'nearest',
        });
      }, 0);
    },
    [performAutoLogin]
  );

  useEffect(() => {
    if (loading) setLoginHighlight(false);
  }, [loading]);

  const selectedAccount = DEMO_ACCOUNTS.find(
    (acct) => acct.user === selectedDemo
  );

  return (
    <div className="min-h-screen bg-[#eef5f8] px-4 py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[600px]">

        {/* BRAND — deliberately compact */}
        <header className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#d9edf3] text-[#246d76]">
            <span className="material-symbols-outlined text-[21px]">explore</span>
          </div>

          <h1 className="font-headline-xl text-[31px] leading-none tracking-tight text-[#172b34]">
            DHRUV
          </h1>

          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#607780]">
              POLAR OPERATIONS
            </span>
            <span className="h-1 w-1 rounded-full bg-[#9db1b7]" />
            <span className="text-[10px] font-bold tracking-wide text-[#356d76]">
              NCPOR • SIH DEMO
            </span>
          </div>
        </header>

        <main className="overflow-hidden rounded-2xl border border-[#d4e2e7] bg-white shadow-[0_14px_40px_rgba(31,55,65,0.09)]">

          {DEMO_MODE && (
            <section className="bg-[#f8fbfc] p-4 sm:p-5">

              {/* THE ONE THING A JUDGE NEEDS TO SEE FIRST */}
              <div className="mb-4 rounded-xl border border-[#cfe1e5] bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9edf3] text-[#246d76]">
                    <span className="material-symbols-outlined text-[20px]">
                      touch_app
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-bold leading-5 text-[#172b34]">
                      SIH Judge Demo
                    </h2>
                    <p className="mt-0.5 text-[11px] leading-4 text-[#657c84]">
                      Select a role — credentials fill automatically.
                    </p>
                  </div>

                  <span className="hidden shrink-0 rounded-full bg-[#e7f3ee] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#27634e] sm:block">
                    Demo Access
                  </span>
                </div>

                {/* Very short instruction */}
                <div className="mt-3 flex items-center gap-2 border-t border-[#edf1f3] pt-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2f7880] text-[10px] font-bold text-white">
                    1
                  </span>
                  <span className="text-[11px] font-semibold text-[#526a72]">
                    Choose a role
                  </span>
                  <span className="text-[#a4b4b9]">→</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2f7880] text-[10px] font-bold text-white">
                    2
                  </span>
                  <span className="text-[11px] font-semibold text-[#526a72]">
                    Press Login
                  </span>
                </div>
              </div>

              {/* ROLE LIST — compact, scannable */}
              <div className="space-y-2">
                {DEMO_ACCOUNTS.map((acct) => {
                  const isSelected = selectedDemo === acct.user;

                  return (
                    <button
                      key={acct.user}
                      type="button"
                      aria-label={`Use ${acct.role} account: ${acct.user}`}
                      onClick={() => handleDemoSelect(acct)}
                      className={[
                        'relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-[#2f7880] focus:ring-offset-1',
                        isSelected
                          ? 'border-[#2f7880] bg-[#edf8f8] shadow-sm'
                          : acct.recommended
                            ? 'border-[#c6dde1] bg-[#fbfefe] shadow-[0_2px_8px_rgba(47,120,128,0.05)] hover:border-[#8fbfc6] hover:bg-[#f8fcfc]'
                            : 'border-[#d9e5e9] bg-white hover:border-[#a9cbd1] hover:bg-[#fbfdfd]',
                      ].join(' ')}
                    >
                      {/* Icon */}
                      <div
                        className={[
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          isSelected
                            ? 'bg-[#2f7880] text-white'
                            : 'bg-[#edf4f6] text-[#356d76]',
                        ].join(' ')}
                      >
                        <span className="material-symbols-outlined text-[19px]">
                          {acct.icon}
                        </span>
                      </div>

                      {/* Role + purpose */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] font-bold leading-4 text-[#172b34]">
                            {acct.role}
                          </span>

                          {acct.recommended && (
                            <span className="rounded-full bg-[#fff1d9] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#95621c]">
                              Recommended start
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-[10px] leading-3.5 text-[#71868d]">
                          {acct.desc}
                        </p>
                      </div>

                      {/* Credentials */}
                      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                        <span className="rounded-md bg-[#f2f6f7] px-2 py-1 font-mono text-[9px] text-[#587079]">
                          {acct.user}
                        </span>
                        <span className="rounded-md bg-[#f2f6f7] px-2 py-1 font-mono text-[9px] text-[#587079]">
                          {acct.pw}
                        </span>
                      </div>

                      {/* Action */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#d7e3e7] text-[#78939a]">
                        <span className="material-symbols-outlined text-[17px]">
                          {isSelected ? 'check' : 'arrow_forward'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-center text-[9px] text-[#8a9da3]">
                Sample data only • No real expedition data is used
              </p>
            </section>
          )}

          {/* LOGIN — compact single action area */}
          <section className="border-t border-[#dce7eb] bg-white p-4 sm:p-5">

            {selectedAccount ? (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#eef8f7] px-3 py-2">
                <span className="material-symbols-outlined text-[17px] text-[#2f7880]">
                  check_circle
                </span>
                <p className="text-[11px] font-semibold text-[#2b646b]">
                  {selectedAccount.role} selected — credentials are ready.
                </p>
              </div>
            ) : (
              <div className="mb-3">
                <h2 className="text-[15px] font-bold text-[#172b34]">
                  Ready to sign in?
                </h2>
                <p className="mt-0.5 text-[10px] text-[#71868d]">
                  Select a demo role above, or enter credentials manually.
                </p>
              </div>
            )}

            <div
              ref={ariaLiveRef}
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            />

            {error && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            {/* Desktop: fields + button on one line. Mobile: stacked. */}
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#81969d]">
                  person
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className="h-10 w-full rounded-lg border border-[#d4e1e5] bg-white pl-9 pr-3 text-[11px] text-[#172b34] outline-none focus:border-[#2f7880] focus:ring-2 focus:ring-[#2f7880]/10"
                  placeholder="Username"
                  required
                  aria-label="Username"
                />
              </div>

              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#81969d]">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="h-10 w-full rounded-lg border border-[#d4e1e5] bg-white pl-9 pr-3 text-[11px] text-[#172b34] outline-none focus:border-[#2f7880] focus:ring-2 focus:ring-[#2f7880]/10"
                  placeholder="Password"
                  required
                  aria-label="Password"
                />
              </div>

              <button
                ref={loginBtnRef}
                type="submit"
                disabled={loading}
                className={[
                  'h-10 rounded-lg px-5 text-[11px] font-bold text-white shadow-sm transition-all',
                  'flex items-center justify-center gap-1.5 whitespace-nowrap',
                  'bg-[#2f7880] hover:bg-[#276970] hover:shadow-md',
                  'disabled:cursor-not-allowed disabled:bg-[#9fb4b9]',
                  loginHighlight
                    ? 'ring-4 ring-[#2f7880]/20 ring-offset-1'
                    : '',
                ].join(' ')}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">
                      refresh
                    </span>
                    Logging in
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">
                      login
                    </span>
                    Login
                  </>
                )}
              </button>
            </form>

            <div className="mt-3 text-center">
              <p className="text-[10px] text-[#7a8d94]">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold text-[#2f7880] hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </section>

          {/* COMPACT FOOTER */}
          <footer className="flex items-center justify-between border-t border-[#e0e8eb] bg-[#f8fbfc] px-4 py-2.5 text-[9px] text-[#8a9da3]">
            <span className="font-semibold text-[#62777e]">
              DHRUV • Polar Operations
            </span>
            <span className="font-mono">
              IND-CMD-01 • NCPOR
            </span>
          </footer>
        </main>

        <p className="mt-3 text-center text-[9px] text-[#8a9da3]">
          Offline-first polar expedition management system
        </p>
      </div>
    </div>
  );
}

export default Login;
