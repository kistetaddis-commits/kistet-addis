import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Mail, 
  Lock, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  Info,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const loginSchema = z.object({
  email: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const data = await api.login(values.email, values.password);
      
      // Save token to localStorage for subsequent API calls
      if (data.token) {
        localStorage.setItem('kistet_token', data.token);
      }
      
      setUser(data.user);
      toast.success(t('loginSuccess'));
      
      const from = (location.state as any)?.from || (data.user.role === 'admin' ? '/admin/dashboard' : '/organizer/dashboard');
      navigate(from);
    } catch (error: any) {
      toast.error(error.message || t('loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-gray-100 max-w-md w-full"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 italic">Kistet Addis</h1>
          <p className="text-gray-500 font-medium">{t('adminOrganizerLogin')}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('usernameOrEmail')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input 
                        placeholder={t('usernameOrEmailPlaceholder') || "Username or email"}
                        className="pl-12 rounded-2xl py-7 bg-gray-50 border-gray-100 font-bold focus:ring-blue-500"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('password')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input 
                        type="password" 
                        placeholder="••••••••"
                        className="pl-12 rounded-2xl py-7 bg-gray-50 border-gray-100 font-bold focus:ring-blue-500"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full py-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100 transition-all hover:-translate-y-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">{t('login')} <ChevronRight className="w-5 h-5" /></span>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-10 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">{t('demoCredentials') || 'Default Admin'}</p>
              <p className="text-xs text-amber-700 font-medium mt-1">
                Username: KistetAddis<br/>
                Password: 12345678
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;