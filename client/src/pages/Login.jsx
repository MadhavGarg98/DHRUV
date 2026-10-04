import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authService } from '../services/auth';

/* ------------------------------------------------------------------ */
/*  Demo accounts — keep in sync with backend/seed_demo.py            */
/* ------------------------------------------------------------------ */
const DEMO_ACCOUNTS = [
  {
    role: 'Central Command',
    user: 'demo_command',
    pw: 'password123',
    desc: 'Sees every station, alerts and incidents',
    recommended: true,
  },
  {
    role: 'Station Leader',
    user: 'demo_station',
    pw: 'password123',
    desc: 'Manages one station\u2019s stock and people',
    recommended: false,
  },
  {
    role: 'Field Member',
    user: 'demo_field',
    pw: 'password123',
    desc: 'Raises an SOS from the field',
    recommended: false,
  },
];

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
const AUTO_LOGIN = import.meta.env.VITE_DEMO_AUTOLOGIN === 'true';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
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

  // Clear the highlight ring when the user manually edits a field
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

  // Auto-login helper (reuses the same logic as handleSubmit)
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

      // Announce to screen readers
      if (ariaLiveRef.current) {
        ariaLiveRef.current.textContent = `Credentials filled for ${acct.role}`;
      }

      // Optional auto-login
      if (AUTO_LOGIN) {
        performAutoLogin(acct.user, acct.pw);
        return;
      }

      // Scroll Login button into view and focus it
      setTimeout(() => {
        if (loginBtnRef.current) {
          const prefersReduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
          ).matches;
          loginBtnRef.current.scrollIntoView({
            behavior: prefersReduced ? 'auto' : 'smooth',
            block: 'nearest',
          });
          loginBtnRef.current.focus();
        }
      }, 0);
    },
    [performAutoLogin]
  );

  // Remove highlight after successful submit
  useEffect(() => {
    if (!loading) return;
    setLoginHighlight(false);
  }, [loading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="max-w-md w-full bg-surface-container border border-outline-variant rounded-[3px] p-space-lg shadow-lg">
        {/* ---- Branding ---- */}
        <div className="text-center mb-space-lg">
          <div className="flex items-center justify-center gap-space-xs mb-space-sm">
            <span className="material-symbols-outlined text-[48px] text-primary">
              explore
            </span>
          </div>

          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            DHRUV
          </h1>

          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mt-space-xs">
            Polar Operations
          </p>

          <div className="mt-space-sm px-space-xs py-[2px] bg-secondary-container text-on-secondary-fixed-variant border border-outline-variant rounded-sm font-data-mono-md inline-block">
            NCPOR
          </div>
        </div>

        {/* ---- Demo box (above the form) ---- */}
        {DEMO_MODE && (
          <div className="mb-space-lg border border-outline-variant rounded-[3px] p-space-md bg-surface">
            {/* Title */}
            <p className="font-title-sm text-title-sm text-on-surface font-semibold mb-space-xs">
              Judges and testers: sign in with a demo account
            </p>

            {/* Step markers */}
            <div className="flex items-center gap-space-md mb-space-md">
              <span className="inline-flex items-center gap-[4px] font-body-sm text-body-sm text-on-surface-variant">
                <span className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full bg-primary-container text-on-surface font-label-sm text-[11px] font-semibold">
                  1
                </span>
                Tap a role
              </span>
              <span className="inline-flex items-center gap-[4px] font-body-sm text-body-sm text-on-surface-variant">
                <span className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full bg-primary-container text-on-surface font-label-sm text-[11px] font-semibold">
                  2
                </span>
                Press Login
              </span>
            </div>

            {/* Account cards */}
            <div className="flex flex-col gap-space-xs">
              {DEMO_ACCOUNTS.map((acct) => {
                const isSelected = selectedDemo === acct.user;
                return (
                  <button
                    key={acct.user}
                    type="button"
                    aria-label={`Use ${acct.role} account: ${acct.user}`}
                    className={[
                      'relative w-full min-h-[64px] text-left px-space-md py-space-sm rounded-[3px] border transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
                      isSelected
                        ? 'border-primary bg-primary-container'
                        : 'border-outline-variant bg-surface hover:bg-primary-container/30',
                    ].join(' ')}
                    onClick={() => handleDemoSelect(acct)}
                  >
                    {/* Recommended tag */}
                    {acct.recommended && (
                      <span className="absolute top-[6px] right-[8px] inline-flex items-center gap-[2px] px-[6px] py-[1px] rounded-sm bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-[10px] uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[12px]">
                          star
                        </span>
                        Recommended
                      </span>
                    )}

                    {/* Selected indicator */}
                    {isSelected && (
                      <span className="absolute top-[6px] right-[8px] inline-flex items-center gap-[3px] px-[6px] py-[1px] rounded-sm bg-primary text-on-primary font-label-sm text-[10px]">
                        <span className="material-symbols-outlined text-[14px]">
                          check_circle
                        </span>
                        Selected, now press Login
                      </span>
                    )}

                    {/* Role name */}
                    <span className="block font-title-sm text-title-sm text-on-surface font-semibold pr-[120px]">
                      {acct.role}
                    </span>

                    {/* Description */}
                    <span className="block font-body-sm text-body-sm text-on-surface-variant mt-[2px]">
                      {acct.desc}
                    </span>

                    {/* Credentials */}
                    <span className="block font-data-mono-md text-on-surface-variant mt-[4px]" style={{ fontSize: '11px' }}>
                      Username:&nbsp;{acct.user}&nbsp;&nbsp;&nbsp;Password:&nbsp;{acct.pw}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sample data note */}
            <p className="font-body-sm text-on-surface-variant mt-space-sm text-center" style={{ fontSize: '11px' }}>
              Sample data only.
            </p>
          </div>
        )}

        {/* ---- Aria-live region for screen readers ---- */}
        <div
          ref={ariaLiveRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        {/* ---- Error banner ---- */}
        {error && (
          <div className="bg-error-container border border-error text-on-error-container px-space-md py-space-sm rounded-[3px] mb-space-md font-body-sm text-body-sm">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>

              {error}
            </div>
          </div>
        )}

        {/* ---- Login form (unchanged behaviour) ---- */}
        <form
          onSubmit={handleSubmit}
          className="space-y-space-md"
        >
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-xs">
              Username
            </label>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                person
              </span>

              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className="w-full pl-10 pr-space-md py-space-sm bg-surface border border-outline-variant rounded-[3px] text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-space-xs">
              Password
            </label>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">
                lock
              </span>

              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-10 pr-space-md py-space-sm bg-surface border border-outline-variant rounded-[3px] text-on-surface font-body-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            ref={loginBtnRef}
            type="submit"
            disabled={loading}
            className={[
              'w-full bg-primary-container text-on-primary py-space-sm px-space-md rounded-[3px] font-title-sm text-title-sm hover:bg-primary disabled:bg-surface-container disabled:text-on-surface-variant transition-colors flex items-center justify-center gap-space-xs',
              loginHighlight
                ? 'ring-2 ring-primary ring-offset-2'
                : '',
            ].join(' ')}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">
                  refresh
                </span>

                Logging in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">
                  login
                </span>

                Login
              </>
            )}
          </button>
        </form>

        <div className="mt-space-md text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Do not have an account?{' '}
            <Link
              to="/register"
              className="text-primary hover:underline font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-space-lg pt-space-md border-t border-outline-variant text-center">
          <p className="font-title-sm text-title-sm text-on-surface font-semibold">
            DHRUV
          </p>

          <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
            Plan. Track. Predict. Respond.
          </p>

          <p className="font-label-sm text-label-sm text-secondary mt-space-xs">
            Even when the network is down.
          </p>
        </div>

        <div className="mt-space-md pt-space-sm border-t border-outline-variant flex items-center justify-between text-on-surface-variant font-data-mono-md text-body-sm">
          <span>Terminal: IND-CMD-01</span>
          <span>NCPOR</span>
        </div>
      </div>
    </div>
  );
}

export default Login;