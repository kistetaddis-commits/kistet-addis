import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LogIn, Loader2, User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { loginWithUsernameOrEmail } from "../lib/api";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, isLoading: authLoading, setUser } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectedRef = useRef(false);

  const redirectUser = useCallback((user: any) => {
    if (!user || redirectedRef.current) return;

    const role = user.role || 'organizer';

    const from =
      (location.state as any)?.from ||
      (role === 'admin' ? '/admin/dashboard' : '/scanner');

    redirectedRef.current = true;
    navigate(from, { replace: true });
  }, [navigate, location.state]);

  useEffect(() => {
    if (!authLoading && authUser && !redirectedRef.current) {
      redirectUser(authUser);
    }
  }, [authUser, authLoading, redirectUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const result = await loginWithUsernameOrEmail(identifier, password);

      // ✅ FIX 1: better response validation
      if (!result || !result.user || !result.token) {
        toast.error(result?.message || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // ✅ FIX 2: SAVE TOKEN (CRITICAL)
      localStorage.setItem("token", result.token);

      // ✅ FIX 3: set auth user
      setUser(result.user);

      toast.success(`Welcome back, ${result.user.name || 'User'}!`);

      // ✅ FIX 4: redirect immediately
      redirectUser(result.user);

    } catch (err: any) {
      console.error("LOGIN ERROR:", err);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading && !authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20 bg-gray-50">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl w-full max-w-md border border-gray-100">

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-gray-900">Staff Portal</h2>
          <p className="text-gray-500 mt-2 font-medium">
            Login to manage events and tickets
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">

          <div>
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Username or Email
            </label>

            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {t('adminLogin')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;