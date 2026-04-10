import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronLeft, 
  Ticket as TicketIcon, 
  User as UserIcon, 
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'organizer')) {
      navigate('/login');
      return;
    }

    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = async (decodedText: string) => {
      scanner.clear();
      setIsScanning(false);
      handleScanResult(decodedText);
    };

    scanner.render(onScanSuccess, (err) => {
      // console.warn(err);
    });

    return () => {
      scanner.clear();
    };
  }, [user, navigate]);

  const handleScanResult = async (qrCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.scanTicket(qrCode);
      if (result.success) {
        setScanResult(result.ticket);
        toast.success('Ticket verified successfully!');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err: any) {
      setError('Error verifying ticket');
      toast.error('Error verifying ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);
    window.location.reload(); // Simplest way to restart the scanner
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 p-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-black text-gray-900">Ticket Scanner</h1>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span className="text-blue-600 font-black text-sm">Secure Mode</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6 flex flex-col items-center justify-center">
        {isScanning && (
          <div className="w-full space-y-8 animate-in fade-in duration-700">
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden relative">
              <div id="reader" className="w-full overflow-hidden rounded-2xl"></div>
              <div className="absolute inset-0 pointer-events-none border-[12px] border-white"></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-black text-gray-900">Ready to Scan</p>
              <p className="text-gray-500 font-medium">Align the ticket QR code within the frame</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-xl font-black text-gray-900">Verifying Ticket...</p>
          </div>
        )}

        {scanResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white rounded-[3rem] shadow-2xl border-4 border-green-500 overflow-hidden"
          >
            <div className="bg-green-500 p-8 text-white text-center">
              <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
              <h2 className="text-3xl font-black">Access Granted</h2>
              <p className="text-green-100 font-bold uppercase tracking-widest mt-2">Verified Successfully</p>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Attendee</p>
                    <p className="text-2xl font-black text-gray-900">{scanResult.user_name}</p>
                    <p className="text-gray-500 font-bold">{scanResult.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <TicketIcon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Event</p>
                    <p className="text-2xl font-black text-gray-900">{scanResult.event_title}</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={resetScanner}
                className="w-full py-8 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg"
              >
                Scan Next Ticket
              </Button>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-white rounded-[3rem] shadow-2xl border-4 border-red-500 overflow-hidden"
          >
            <div className="bg-red-500 p-8 text-white text-center">
              <XCircle className="w-20 h-20 mx-auto mb-4" />
              <h2 className="text-3xl font-black">Invalid Ticket</h2>
              <p className="text-red-100 font-bold uppercase tracking-widest mt-2">Verification Failed</p>
            </div>
            
            <div className="p-10 text-center space-y-8">
              <p className="text-xl font-bold text-gray-600">{error}</p>
              <Button 
                onClick={resetScanner}
                className="w-full py-8 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-lg"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ScannerPage;