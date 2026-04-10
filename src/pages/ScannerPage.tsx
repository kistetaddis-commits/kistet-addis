import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Loader2, CheckCircle, XCircle, RefreshCw, Smartphone } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const ScannerPage: React.FC = () => {
  const [qrInput, setQrInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; ticket?: any } | null>(null);
  const navigate = useNavigate();

  const handleScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!qrInput) return;
    
    setLoading(true);
    setResult(null);
    try {
      const data = await api.verifyTicket(qrInput);
      setResult({ 
        success: data.success, 
        message: data.message, 
        ticket: data.ticket 
      });
      if (data.success) {
        toast.success('Ticket Validated');
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      setResult({ 
        success: false, 
        message: err.message || 'Verification failed' 
      });
      toast.error('Invalid Ticket');
    } finally {
      setLoading(false);
      setQrInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-100 mb-6">
            <QrCode className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-gray-900">Ticket Scanner</h1>
          <p className="text-gray-500 mt-2 font-medium">Enter ticket ID or scan QR code</p>
        </div>

        <form onSubmit={handleScan} className="space-y-4">
          <div className="space-y-2">
             <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ticket Data</label>
             <input 
              className="w-full p-5 bg-gray-50 border border-gray-100 rounded-3xl font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Enter QR content..." 
              value={qrInput} 
              onChange={e => setQrInput(e.target.value)} 
              required 
              autoFocus
            />
          </div>
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-blue-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify Ticket'}
          </button>
        </form>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-8 rounded-[2.5rem] space-y-4 border ${result.success ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}
            >
              <div className="flex items-center gap-4">
                {result.success ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                <div>
                  <p className="text-xl font-black">{result.success ? 'Access Granted' : 'Access Denied'}</p>
                  <p className="font-medium opacity-80">{result.message}</p>
                </div>
              </div>
              
              {result.ticket && (
                <div className="pt-4 border-t border-current/10 space-y-2">
                  <p className="text-sm font-bold"><span className="opacity-60 uppercase text-[10px] block">Attendee</span> {result.ticket.user_name}</p>
                  <p className="text-sm font-bold"><span className="opacity-60 uppercase text-[10px] block">Event</span> {result.ticket.event_title}</p>
                  <p className="text-sm font-bold"><span className="opacity-60 uppercase text-[10px] block">Status</span> {result.ticket.status.toUpperCase()}</p>
                </div>
              )}

              <button 
                onClick={() => setResult(null)}
                className="w-full mt-4 py-3 bg-white/50 rounded-2xl font-bold text-sm hover:bg-white/80 transition-all"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-center gap-6">
          <button onClick={() => navigate('/admin/dashboard')} className="text-gray-400 font-bold text-sm hover:text-gray-600">Dashboard</button>
          <button onClick={() => window.location.reload()} className="text-gray-400 font-bold text-sm hover:text-gray-600 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reload</button>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;