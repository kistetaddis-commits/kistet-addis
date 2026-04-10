import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Loader2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const OrganizerLogin: React.FC = () => {
  const { t } = useLanguage();
  const { user: authUser, isLoading: authLoading, setUser, signOut } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && authUser) {
      if (authUser.role === 'organizer' || authUser.role === 'admin') {
        const from = (location.state as any)?.from || (authUser.role === 'admin' ? '/admin/dashboard' : '/organizer/dashboard');
        navigate(from, { replace: true });
      }
    }
  }, [authUser, authLoading, navigate, location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.login(identifier, password);
      
      if (data.user.role !== 'organizer' && data.user.role !== 'admin') {
        toast.error('Access denied. This portal is for organizers only.');
        signOut();
        setLoading(false);
        return;
      }

      // Save token to localStorage for subsequent API calls
      if (data.token) {
        localStorage.setItem('kistet_token', data.token);
      }

      toast.success(`Welcome, ${data.user.name || 'Organizer'}`);
      setUser(data.user);
      
      const from = (location.state as any)?.from || (data.user.role === 'admin' ? '/admin/dashboard' : '/organizer/dashboard');
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white mb-6">
            <Briefcase className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Organizer Portal</h1>
          <p className="text-gray-500 mt-3 font-medium text-lg">Manage your assigned events and tickets</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                className="w-full pl-14 pr-4 py-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none transition-all font-bold"
                placeholder="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="w-full pl-14 pr-14 py-5 bg-gray-50 border border-gray-100 rounded-3xl outline-none transition-all font-bold"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-5 rounded-3xl font-black text-lg shadow-xl"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizerLogin;