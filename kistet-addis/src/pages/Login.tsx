import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { LogIn, Loader2, User, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { loginWithUsernameOrEmail } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLogin?: (role: 'admin' | 'organizer') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, isLoading: authLoading, setUser } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isNavigating = useRef(false);

  const logoUrl = "https://storage.googleapis.com/dala-prod-public-storage/attachments/18fcb530-83a1-4b00-a8a0-fe9a27e33d5e/1774954026086_logos-03.jpg";

  // Helper function for redirection
  const performRedirect = (user: any) => {
    if (isNavigating.current) return;
    
    console.log('Login: Performing redirect for user role:', user.role);
    const from = (location.state as any)?.from || (user.role === 'admin' ? '/admin/dashboard' : '/scanner');
    console.log('Login: Navigating to:', from);
    
    isNavigating.current = true;
    navigate(from, { replace: true });
    if (onLogin) onLogin(user.role as 'admin' | 'organizer');
  };

  // Listen for user changes to trigger navigation
  useEffect(() => {
    if (!authLoading && authUser && !isNavigating.current) {
      console.log('Login: User detected in useEffect, redirecting...', authUser.role);
      performRedirect(authUser);
    }
  }, [authUser, authLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    console.log('Login: Attempting login for:', identifier);

    try {
      const { user, error } = await loginWithUsernameOrEmail(identifier, password);
      
      if (error || !user) {
        console.error('Login: Login failed:', error);
        toast.error(error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      console.log('Login: Login success, updating AuthContext state:', user.id);
      
      // Update global context state
      setUser(user);
      toast.success(`Welcome back, ${user.name || 'User'}!`);
      
    } catch (err: any) {
      console.error('Login: Unexpected login error:', err);
      toast.error('An error occurred during login');
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
        <div className="text-center mb-10 flex flex-col items-center">
          <div 
            className="w-64 h-20 bg-no-repeat bg-contain mb-6"
            style={{ 
              backgroundImage: `url(${logoUrl})`,
              backgroundPosition: '0% 0%',
              backgroundSize: '200% 200%'
            }}
            role="img"
            aria-label="Kistet Addis Logo"
          />
          <h2 className="text-3xl font-black text-gray-900">Staff Portal</h2>
          <p className="text-gray-500 mt-2 font-medium">Login to manage events and tickets</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Username or Email
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
              placeholder="Enter your credentials"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" /> Password
            </label>
            <input 
              type="password" 
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
            {t('adminLogin')}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">
            Staff access only
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;