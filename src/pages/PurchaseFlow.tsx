import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  ChevronRight, 
  Download, 
  Phone, 
  User as UserIcon, 
  Mail, 
  Hash, 
  Clock, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { PaymentMethod, PaymentStatus, Event, PurchaseFormData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 1 | 2 | 3 | 4;

const PurchaseFlow: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<PurchaseFormData>({ fullName: '', phone: '', email: '', quantity: 1 });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('telebirr');
  const [transactionId, setTransactionId] = useState('');
  const [globalSettings, setGlobalSettings] = useState<any[]>([]);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        const ev = await api.getEventById(id);
        setEvent(ev);
        const settings = await api.getSettings();
        setGlobalSettings(settings);
      } catch (error) {
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const startPolling = (ticketId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.getPaymentStatus(ticketId);
        setPaymentStatus(res.status);
        if (res.status === 'approved') {
          setStep(4);
          // In a real app, the approved response would include the QR code
          // For now, we'll just set it to a placeholder or wait for the next fetch
          clearInterval(interval);
          toast.success('Payment verified successfully!');
        } else if (res.status === 'rejected') {
          clearInterval(interval);
          toast.error('Payment verification failed');
          setStep(2);
        }
      } catch (error) {}
    }, 5000);
    return () => clearInterval(interval);
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone) { toast.error('Please fill required fields'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!transactionId) { toast.error('Please enter transaction ID'); return; }
      setIsSubmitting(true);
      try {
        const ticket = await api.createTicket({
          event_id: id,
          user_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          quantity: formData.quantity
        });
        
        await api.submitPayment({
          ticket_id: ticket.id,
          method: selectedMethod,
          transaction_id: transactionId,
          amount: formData.quantity * (event?.ticket_price || 0)
        });

        setCurrentTicketId(ticket.id);
        setStep(3);
        startPolling(ticket.id);
      } catch (error: any) {
        toast.error(error.message || 'Error processing purchase');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const downloadTicket = () => {
    if (!event || !currentTicketId) return;
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('KISTET ADDIS TICKET', 105, 40, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Event: ${typeof event.title === 'string' ? event.title : 'Event'}`, 20, 70);
    doc.text(`Attendee: ${formData.fullName}`, 20, 85);
    doc.text(`Location: ${event.location}`, 20, 100);
    doc.text(`Date: ${new Date(event.event_date).toLocaleDateString()}`, 20, 115);
    doc.text(`Ticket ID: ${currentTicketId}`, 20, 130);
    doc.save(`Ticket_${currentTicketId}.pdf`);
  };

  const currentSetting = globalSettings.find(s => s.payment_method === selectedMethod);

  const getVerificationLink = () => {
    if (selectedMethod === 'telebirr') {
      return `https://transactioninfo.ethiotelecom.et/receipt/${transactionId}`;
    } else if (selectedMethod === 'cbe_birr' || selectedMethod === 'cbe') {
      return `https://apps.cbe.com.et:100/?id=${transactionId}`;
    }
    return null;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (!event) return <div className="p-20 text-center">Event not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <h2 className="text-2xl font-black">Buyer Information</h2>
                <div className="space-y-4">
                  <div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Full Name" className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-gray-50 font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}/></div>
                  <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="tel" placeholder="Phone Number" className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-gray-50 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}/></div>
                  <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="email" placeholder="Email (Optional)" className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-gray-50 font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}/></div>
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem]">
                    <span className="font-bold">Quantity</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})} className="w-10 h-10 rounded-xl bg-white border font-bold shadow-sm">-</button>
                      <span className="text-xl font-black">{formData.quantity}</span>
                      <button onClick={() => setFormData({...formData, quantity: formData.quantity + 1})} className="w-10 h-10 rounded-xl bg-white border font-bold shadow-sm">+</button>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-600 p-6 rounded-[2rem] flex items-center justify-between text-white shadow-xl">
                  <div><p className="text-xs font-bold opacity-70">Total Amount</p><p className="text-3xl font-black">{formData.quantity * (event.ticket_price || 0)} ETB</p></div>
                  <button onClick={handleNext} className="bg-white text-blue-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2">Next <ChevronRight className="w-5 h-5" /></button>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <h2 className="text-2xl font-black text-center">Payment</h2>
                <div className="grid grid-cols-3 gap-3">
                  {['telebirr', 'cbe_birr', 'mpesa'].map(m => (
                    <button key={m} onClick={() => setSelectedMethod(m as any)} className={`p-4 rounded-3xl border-2 transition-all ${selectedMethod === m ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}>
                      <span className="text-[10px] font-black uppercase">{m.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
                {currentSetting && (
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-300">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Account Info</p>
                    <p className="text-xl font-black">{currentSetting.account_details}</p>
                    {getVerificationLink() && (
                      <a 
                        href={getVerificationLink() || '#'}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 text-xs font-bold mt-3 flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Verify Transaction
                      </a>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Transaction ID</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder="Enter transaction ID" 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border bg-gray-50 font-mono font-bold"
                      value={transactionId} 
                      onChange={e => setTransactionId(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-5 rounded-2xl font-black bg-gray-100 hover:bg-gray-200">Back</button>
                  <button 
                    onClick={handleNext} 
                    disabled={isSubmitting || !transactionId} 
                    className="flex-[2] py-5 rounded-2xl font-black bg-blue-600 text-white shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Submit Payment'}
                  </button>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 py-8">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto animate-pulse"><Clock className="w-12 h-12 text-blue-600" /></div>
                <h2 className="text-3xl font-black">Waiting for Approval</h2>
                <p className="text-gray-500 font-medium">Admin is verifying your transaction.<br/>Please keep this page open.</p>
                <div className="bg-gray-50 p-8 rounded-[3rem] opacity-30 grayscale inline-block border">
                  <QRCodeSVG value="PENDING_VERIFICATION" size={160} />
                </div>
                <button onClick={() => navigate('/')} className="w-full py-5 rounded-2xl font-black bg-gray-900 text-white">Return Home</button>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-4">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-sm"><Check className="w-12 h-12 text-green-600" /></div>
                <h2 className="text-3xl font-black">Ticket Ready!</h2>
                <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-blue-50 inline-block">
                  <QRCodeSVG value={`NAME:${formData.fullName}|EVENT:${typeof event.title === 'string' ? event.title : 'Event'}|ID:${currentTicketId}`} size={200} />
                </div>
                <div className="space-y-3">
                  <button onClick={downloadTicket} className="w-full py-5 rounded-2xl font-black bg-blue-600 text-white flex items-center justify-center gap-3 shadow-xl shadow-blue-100"><Download className="w-6 h-6" /> Download PDF</button>
                  <button onClick={() => navigate('/')} className="w-full py-5 rounded-2xl font-black bg-gray-50 text-gray-600">Back to Home</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PurchaseFlow;