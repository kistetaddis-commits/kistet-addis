import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft,
  Smartphone, 
  Building, 
  CheckCircle2,
  Ticket as TicketIcon,
  Clock,
  RefreshCw,
  Plus,
  Minus,
  Mail,
  User,
  Phone,
  CreditCard,
  Download,
  Share2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { Event, PurchaseFormData, PaymentMethod, Ticket } from '../types';
import { toast } from 'sonner';
import TicketQR from './TicketQR';

interface TicketPurchaseFlowProps {
  event: Event;
  onClose: () => void;
}

const TicketPurchaseFlow: React.FC<TicketPurchaseFlowProps> = ({ event, onClose }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [formData, setFormData] = useState<PurchaseFormData>({
  eventId: '',
  fullName: '',
  phone: '',
  email: '',
  quantity: 1,
  paymentMethod: 'Telebirr'
});
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Telebirr');
  const [transactionId, setTransactionId] = useState('');
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  const getEventTitle = () => {
    if (typeof event.title === 'string') return event.title;
    return (event.title as any)[language] || (event.title as any).en || '';
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('251')) return '+' + cleaned;
    if (cleaned.startsWith('0')) return cleaned;
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
    
    if (formatted.length > 0 && !/^(\+251|0)(7|9)\d{8}$/.test(formatted)) {
      setErrors(prev => ({ ...prev, phone: 'Invalid phone format' }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Required';
    if (!formData.phone.trim()) newErrors.phone = 'Required';
    else if (!/^(\+251|0)(7|9)\d{8}$/.test(formData.phone)) newErrors.phone = 'Invalid';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (step === 1 && validateStep1()) {
      setDirection(1);
      setStep(2);
    }
  };

  const goToPrevStep = () => {
    setDirection(-1);
    setStep(1);
  };

  const onSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error('Enter transaction ID');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticket = await api.createTicket({
        event_id: event.id,
        user_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        quantity: formData.quantity,
        payment_method: selectedMethod,
        transaction_id: transactionId,
        status: 'pending_payment'
      });

      api.purchaseTicket({
        ticket_id: ticket.id,
        amount: formData.quantity * event.price,
        method: selectedMethod,
        transaction_id: transactionId
      });

      setCreatedTicket(ticket);
      setDirection(1);
      setStep(3);
      toast.success('Submitted for approval');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkStatus = async () => {
    if (!createdTicket) return;
    setIsRefreshing(true);
    try {
      const updated = await api.getTicketById(createdTicket.id);
      setCreatedTicket(updated);
    } catch (err) {
      toast.error('Check failed');
    } finally {
      setIsRefreshing(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0 })
  };

  const paymentMethods = [
    { id: 'Telebirr', icon: Smartphone, color: 'bg-blue-100 text-blue-600', account: '0911 22 33 44', placeholder: 'Example: TX789...' },
    { id: 'CBE', icon: Building, color: 'bg-purple-100 text-purple-600', account: '1000 2233 4455', placeholder: 'Example: FT245...' },
    { id: 'M-Pesa', icon: CreditCard, color: 'bg-red-100 text-red-600', account: '0711 22 33 44', placeholder: 'Example: QW567...' },
  ];

  const selectedPaymentInfo = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden relative border border-white/20 my-auto"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-gray-100/50 dark:bg-slate-800/50 rounded-full hover:bg-gray-200 transition-all z-20">
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex flex-col md:flex-row min-h-[500px]">
          <div className="bg-slate-50 dark:bg-slate-800/50 md:w-60 p-6 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-700">
            <div className="mb-6">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-2">Purchase</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{getEventTitle()}</h3>
            </div>
            
            <div className="mt-auto space-y-4">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{(formData.quantity * event.price).toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-400">ETB</span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <TicketIcon className="w-4 h-4 text-green-500" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Secure Checkout</p>
              </div>
            </div>
          </div>

          <div className="flex-grow p-6 md:p-8 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-blue-600' : 'w-2 bg-gray-100'}`} />
              ))}
            </div>

            <div className="flex-grow relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', damping: 20, stiffness: 150 }}
                  className="w-full h-full flex flex-col"
                >
                  {step === 1 && (
                    <div className="space-y-5">
                      <header>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Details</h2>
                        <p className="text-xs text-slate-500">Provide info for your ticket.</p>
                      </header>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              type="text"
                              value={formData.fullName}
                              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                              className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.fullName ? 'border-red-500' : 'border-gray-100 dark:border-slate-700'} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold`}
                              placeholder="e.g. Abebe Bikila"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Phone</label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="tel"
                                value={formData.phone}
                                onChange={handlePhoneChange}
                                className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.phone ? 'border-red-500' : 'border-gray-100 dark:border-slate-700'} rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold`}
                                placeholder="09..."
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Email</label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Quantity</label>
                          <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700">
                            <button onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center shadow-sm">
                              <Minus className="w-4 h-4" />
                            </button>
                            <div className="flex-grow text-center font-bold">{formData.quantity}</div>
                            <button onClick={() => setFormData({...formData, quantity: Math.min(10, formData.quantity + 1)})} className="w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center shadow-sm">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-auto">
                        <motion.button 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={goToNextStep}
                          disabled={!formData.fullName || !formData.phone || !!errors.phone}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                          Continue <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <header className="flex items-center gap-2">
                        <button onClick={goToPrevStep} className="p-1.5 -ml-1.5 text-slate-400 hover:text-slate-900">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payment</h2>
                        </div>
                      </header>

                      <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-2">
                          {paymentMethods.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedMethod === m.id ? 'border-blue-600 bg-blue-50/50' : 'border-gray-50 dark:border-slate-800 bg-gray-50/50 hover:border-blue-200'}`}
                            >
                              <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center`}>
                                <m.icon className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-[9px] uppercase tracking-wider">{m.id}</span>
                            </button>
                          ))}
                        </div>

                        <div className="p-5 bg-slate-900 rounded-2xl text-white">
                          <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Transfer to</p>
                          <p className="text-xl font-black text-blue-400 tracking-tight">{selectedPaymentInfo?.account}</p>
                          <p className="text-[9px] mt-2 opacity-50 italic">Complete transfer before submitting.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transaction ID</label>
                          <input 
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-center uppercase tracking-widest"
                            placeholder={selectedPaymentInfo?.placeholder}
                          />
                        </div>
                      </div>

                      <div className="pt-4 mt-auto">
                        <motion.button 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={onSubmit}
                          disabled={isSubmitting || !transactionId}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                        >
                          {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Finish</>}
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      {createdTicket?.status === 'approved' ? (
                        <div className="space-y-5 w-full max-w-sm">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ticket Confirmed!</h2>
                            <p className="text-xs text-slate-500 mt-1">Your payment was verified.</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-100 flex justify-center">
                            <TicketQR 
  ticketId={createdTicket.id}  
  eventId={event.id}  
  userName={createdTicket.user_name}  
  size={150} 
/>
                          </div>
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <button className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-xs font-bold"><Download className="w-3.5 h-3.5" /> Save</button>
                            <button className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-xs font-bold"><Share2 className="w-3.5 h-3.5" /> Share</button>
                          </div>
                          <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline underline-offset-4">Close</button>
                        </div>
                      ) : (
                        <div className="space-y-5 w-full max-w-sm">
                          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Clock className="w-8 h-8 text-amber-500" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verifying Payment</h2>
                            <p className="text-xs text-slate-500 mt-1">This usually takes a few minutes.</p>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-100 text-left">
                            <p className="text-[10px] font-bold text-amber-600 uppercase">Transaction ID</p>
                            <p className="font-bold text-slate-900 dark:text-white tracking-widest">{transactionId.toUpperCase()}</p>
                          </div>
                          <motion.button 
                            whileTap={{ scale: 0.98 }}
                            onClick={checkStatus} 
                            disabled={isRefreshing}
                            className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Update Status
                          </motion.button>
                          <button onClick={onClose} className="text-xs font-bold text-slate-500">I'll check later</button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TicketPurchaseFlow;