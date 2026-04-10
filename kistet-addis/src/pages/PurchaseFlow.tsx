import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  CreditCard, 
  ChevronRight, 
  Download, 
  Phone, 
  User as UserIcon, 
  Mail, 
  Hash, 
  Clock, 
  ArrowLeft,
  Loader2,
  Copy,
  Smartphone,
  Building2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { PaymentMethod, PaymentStatus, Event, PurchaseFormData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 1 | 2 | 3 | 4;
const STORAGE_KEY = 'kistet_purchase_state';

const PurchaseFlow: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<PurchaseFormData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.formData) return parsed.formData;
      } catch (e) {}
    }
    return { fullName: '', phone: '', email: '', quantity: 1 };
  });

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).selectedMethod || 'Telebirr' : 'Telebirr';
  });

  const [transactionId, setTransactionId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).transactionId || '' : '';
  });

  const [currentTicketId, setCurrentTicketId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).currentTicketId || null : null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, selectedMethod, transactionId, currentTicketId, step }));
  }, [formData, selectedMethod, transactionId, currentTicketId, step]);

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        const ev = await api.getEvent(id);
        setEvent(ev);
        
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.step) setStep(parsed.step);
        }
      } catch (error) {
        toast.error('Failed to load event.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone) { toast.error(t('fillRequiredFields')); return; }
      setStep(2);
    } else if (step === 2) {
      if (!transactionId) { toast.error(t('transactionId')); return; }
      setIsSubmitting(true);
      try {
        const res = await api.purchaseTicket({
          event_id: id!,
          user_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          quantity: formData.quantity,
          method: selectedMethod,
          transaction_id: transactionId,
          amount: (event?.price || 0) * formData.quantity,
        });
        setCurrentTicketId(res.ticket_id);
        setStep(3);
        toast.success(t('requestSubmitted'));
      } catch (error: any) {
        toast.error(error.message || 'Error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const downloadTicket = () => {
    if (!event || !currentTicketId) return;
    try {
      const doc = new jsPDF();
      const title = event.title;
      doc.setFillColor(37, 99, 235); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(24); doc.text('KISTET ADDIS', 105, 25, { align: 'center' });
      doc.setTextColor(0, 0, 0); doc.setFontSize(16); doc.text(title, 20, 60);
      doc.setFontSize(12);
      doc.text(`${t('fullName')}: ${formData.fullName}`, 20, 80);
      doc.text(`${t('phoneNumber')}: ${formData.phone}`, 20, 90);
      doc.text(`${t('numberOfTickets')}: ${formData.quantity}`, 20, 100);
      doc.text(`${t('location')}: ${event.location}`, 20, 110);
      doc.text(`${t('date')}: ${new Date(event.date).toLocaleDateString()}`, 20, 120);
      doc.text(`${t('transactionId')}: ${transactionId}`, 20, 130);
      doc.text(`${t('ticketIdLabel')}: ${currentTicketId}`, 20, 140);
      doc.save(`Ticket_${title}.pdf`);
      toast.success(t('ticketDownloaded'));
    } catch (e) { toast.error('Error generating PDF'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>;
  if (!event) return <div className="p-20 text-center">{t('eventNotFound')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        <div className="px-8 py-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><CreditCard className="w-6 h-6" /></div><div><h2 className="text-xl font-black text-gray-900 tracking-tight">{t('purchaseTicketTitle')}</h2><p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{event.title}</p></div></div>
          {step < 3 && <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-400" /></button>}
        </div>
        <div className="h-1.5 w-full bg-gray-100"><motion.div className="h-full bg-blue-600" animate={{ width: `${(step / 4) * 100}%` }}/></div>
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">{t('fullName')} *</label><div className="relative"><UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder={t('fullNamePlaceholder')} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}/></div></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">{t('phoneNumber')} *</label><div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="tel" placeholder={t('phonePlaceholder')} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}/></div></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">{t('email')}</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="email" placeholder={t('emailPlaceholder')} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}/></div></div>
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100"><span className="font-bold text-gray-700">{t('numberOfTickets')}</span><div className="flex items-center gap-6 bg-white p-2 rounded-2xl shadow-sm border"><button onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold">-</button><span className="text-2xl font-black w-8 text-center">{formData.quantity}</span><button onClick={() => setFormData({...formData, quantity: Math.min(10, formData.quantity + 1)})} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold">+</button></div></div>
                </div>
                <div className="bg-blue-600 p-6 rounded-[2rem] flex items-center justify-between shadow-xl"><div className="text-white"><p className="text-white/70 text-xs font-bold">{t('totalAmount')}</p><p className="text-3xl font-black">{formData.quantity * (event.price || 0)} <span className="text-sm font-normal">{t('currency')}</span></p></div><button onClick={handleNext} className="bg-white text-blue-600 px-6 py-4 rounded-2xl font-black flex items-center gap-2 transition-all">{t('next')}<ChevronRight className="w-5 h-5" /></button></div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="text-center space-y-1 mb-4"><h3 className="text-lg font-bold text-gray-900">{t('choosePaymentMethod')}</h3><p className="text-sm text-gray-500">{t('selectServiceMsg')}</p></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: 'Telebirr', icon: Smartphone, label: 'Telebirr', color: 'bg-blue-600' },
                    { id: 'CBE', icon: Building2, label: 'CBE', color: 'bg-purple-600' },
                    { id: 'M-Pesa', icon: Smartphone, label: 'M-Pesa', color: 'bg-green-600' }
                  ].map(method => (
                    <button key={method.id} onClick={() => setSelectedMethod(method.id as PaymentMethod)} className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${selectedMethod === method.id ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-gray-100'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${selectedMethod === method.id ? method.color : 'bg-gray-100'}`}><method.icon className={`w-5 h-5 ${selectedMethod === method.id ? 'text-white' : 'text-gray-400'}`} /></div><span className="text-[10px] font-black uppercase tracking-widest text-gray-800">{method.label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-300 space-y-4">
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">{t('accountInfo')}</p>
                  <p className="text-xl font-black text-gray-900 break-all">{selectedMethod === 'Telebirr' ? '0911223344' : '1000123456789'}</p>
                </div>

                <div className="space-y-2"><label className="text-sm font-bold text-gray-700 ml-1">{t('transactionId')} *</label><div className="relative"><Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder={t('transactionIdPlaceholder')} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all uppercase font-mono" value={transactionId} onChange={(e) => setTransactionId(e.target.value)}/></div></div>
                <div className="flex gap-4 pt-2"><button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-600 py-5 rounded-2xl font-black">{t('back')}</button><button onClick={handleNext} disabled={isSubmitting || !transactionId} className="flex-[2] bg-blue-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2">{isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : t('submitPayment')}</button></div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-8"><div className="relative w-24 h-24 mx-auto"><div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div><div className="relative w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center"><Clock className="w-12 h-12 text-blue-600" /></div></div><div className="space-y-3"><h2 className="text-3xl font-black text-gray-900">{t('waitingApproval')}</h2><p className="text-gray-500 px-10">{t('waitingApprovalMsg')}</p></div><div className="space-y-4 pt-4"><div className="bg-gray-50 py-3 px-6 rounded-2xl inline-block"><span className="text-sm text-gray-500">{t('transactionId')}: </span><span className="font-mono">{transactionId}</span></div><button onClick={() => navigate('/')} className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black">{t('returnHomeWait')}</button></div></motion.div>
            )}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-4"><div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg"><Check className="w-12 h-12 text-green-600" /></div><div className="space-y-2"><h2 className="text-3xl font-black text-gray-900">{t('ticketReady')}</h2><p className="text-green-600 font-bold uppercase text-xs">{t('paymentVerifiedSuccess')}</p></div><div className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-blue-50 inline-block"><QRCodeSVG value={`TICKET:${currentTicketId}:${event.id}`} size={200} includeMargin={true} /></div><div className="space-y-4"><button onClick={downloadTicket} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3"><Download className="w-6 h-6" />{t('downloadTicket')}</button><button onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/'); }} className="w-full text-gray-500 font-bold py-2">{t('closeFinish')}</button></div></motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PurchaseFlow;