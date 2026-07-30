import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ShieldCheck, ArrowRight, Lock, KeyRound } from 'lucide-react';
import { verifyJwtToken, isPasswordResetToken } from '../lib/jwt';
import { supabase } from '../lib/supabase';
import { Footer } from '../components/Footer';

export const AuthVerifyPage: React.FC = () => {
  const { token: paramToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Extract token from route param, query param, or hash fragment
    const queryToken = searchParams.get('token') || searchParams.get('access_token') || searchParams.get('token_hash');
    
    // Hash fragment extract (e.g. #access_token=xyz&type=recovery)
    let hashToken = '';
    const hash = location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      hashToken = hashParams.get('access_token') || hashParams.get('token') || '';
    }

    const token = paramToken || queryToken || hashToken;

    // Check if token or URL parameters indicate password reset
    const isReset = isPasswordResetToken(token || '', searchParams, hash);

    if (isReset) {
      // Redirect to password reset page
      const redirectToken = token || 'reset';
      navigate(`/password/reset?token=${encodeURIComponent(redirectToken)}`, { replace: true });
      return;
    }

    if (!token) {
      // If no token, check if user has active supabase session or show default verification screen
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage('No verification token provided. Please check your verification link.');
        }
      });
      return;
    }

    // Authenticate / Verify JWT token
    const verification = verifyJwtToken(token);
    if (verification.valid) {
      // If valid token, set success
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(verification.error || 'Invalid or expired verification token.');
    }
  }, [paramToken, searchParams, location, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <header className="p-4 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">P</div>
            <span className="font-bold text-lg text-slate-900">Playxcade</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-6">
          {status === 'verifying' && (
            <div className="space-y-4 py-6">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-xl font-bold text-slate-900">Verifying Email...</h2>
              <p className="text-xs text-slate-500">Authenticating token signature, please wait.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6 py-2">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authenticated</span>
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">Email Verified Successfully</h2>
                <p className="text-xs text-slate-600 mt-2">
                  Your email address has been authenticated and verified. You can now access all Garexcell network features.
                </p>
              </div>

              <button
                onClick={() => navigate('/feed')}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm shadow-md transition flex items-center justify-center space-x-2"
              >
                <span>Done</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6 py-2">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
                <p className="text-xs text-rose-600 mt-2 font-medium">{errorMessage}</p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
                >
                  Return to Sign In
                </button>
                <Link
                  to="/password/reset"
                  className="block text-xs font-semibold text-slate-500 hover:text-indigo-600 transition pt-1"
                >
                  Need to reset your password?
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
