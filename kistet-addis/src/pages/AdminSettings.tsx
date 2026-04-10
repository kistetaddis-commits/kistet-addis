import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Smartphone, 
  Building2, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { toast } from 'sonner';

const AdminSettings: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    telebirr: '0911223344',
    cbe_birr: '1000123456789',
    mpesa: '0922334455'
  });

  // In a real app, we'd fetch these from an API. For now, we'll keep them in state.
  useEffect(() => {
    // Mock fetch
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // In this custom backend, settings might be a separate table or just hardcoded for demo
      // Here we just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully!', {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Settings</h1>
              <p className="text-gray-500 font-medium">Configure payment accounts and application behavior</p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-50 bg-blue-50/30">
            <div className="flex items-center gap-3 text-blue-700">
              <Info className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-wider">Payment Account Details</p>
            </div>
            <p className="text-gray-500 mt-2 text-sm">
              These details will be shown to customers during the checkout process when they select a payment method.
            </p>
          </div>

          <form onSubmit={handleSave} className="p-8 md:p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <label className="text-lg font-black text-gray-900">Telebirr Number</label>
                </div>
                <input 
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-800"
                  placeholder="Enter Telebirr account/number"
                  value={settings.telebirr}
                  onChange={(e) => setSettings({...settings, telebirr: e.target.value})}
                  required
                />
                <p className="text-xs text-gray-400 font-medium px-1 italic">
                  Example: 0911223344 or Account Name: Kistet Addis
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <label className="text-lg font-black text-gray-900">CBE Account</label>
                </div>
                <input 
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-800"
                  placeholder="Enter Commercial Bank account"
                  value={settings.cbe_birr}
                  onChange={(e) => setSettings({...settings, cbe_birr: e.target.value})}
                  required
                />
                <p className="text-xs text-gray-400 font-medium px-1 italic">
                  Example: 1000123456789 - Kistet Addis
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <label className="text-lg font-black text-gray-900">M-Pesa Number</label>
                </div>
                <input 
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-gray-800"
                  placeholder="Enter M-Pesa account/number"
                  value={settings.mpesa}
                  onChange={(e) => setSettings({...settings, mpesa: e.target.value})}
                  required
                />
                <p className="text-xs text-gray-400 font-medium px-1 italic">
                  Example: 0922334455 or Merchant Code: 123456
                </p>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50 flex justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-lg flex items-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                Save Settings
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-orange-900">Security Note</h4>
            <p className="text-orange-800/70 text-sm font-medium leading-relaxed">
              These account details are visible to anyone initiating a ticket purchase. Ensure you only provide public-facing business accounts here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;