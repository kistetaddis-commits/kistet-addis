import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  Smartphone, 
  Banknote,
  CheckCircle2,
  Loader2,
  Calendar,
  MapPin,
  Ticket as TicketIcon,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { api } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { Event } from '../types';

interface TicketPurchaseFlowProps {
  event: Event;
  onClose: () => void;
}

type Step = 'quantity' | 'details' | 'payment' | 'confirmation';

const TicketPurchaseFlow: React.FC<TicketPurchaseFlowProps> = ({ event, onClose }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState<Step>('quantity');
  const [quantity, setQuantity] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    transactionId: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'Telebirr' | 'CBE' | 'M-Pesa'>('Telebirr');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = quantity * event.price;

  const handleNext = () => {
    if (step === 'quantity') setStep('details');
    else if (step === 'details') {
      if (!formData.name || !formData.phone) {
        toast.error('Please fill in required fields');
        return;
      }
      setStep('payment');
    }
  };

  const handleBack = () => {
    if (step === 'details') setStep('quantity');
    else if (step === 'payment') setStep('details');
  };

  const handleSubmitPayment = async () => {
    if (!formData.transactionId) {
      toast.error('Please enter the transaction ID');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.purchaseTicket({
        event_id: event.id,
        user_name: formData.name,
        phone: formData.phone,
        email: formData.email,
        quantity,
        method: paymentMethod,
        transaction_id: formData.transactionId,
        amount: totalPrice,
      });
      setStep('confirmation');
      toast.success('Ticket request submitted!');
    } catch (error: any) {
      toast.error(error.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentLink = () => {
    if (paymentMethod === 'Telebirr') return `https://transactioninfo.ethiotelecom.et/receipt/${formData.transactionId}`;
    if (paymentMethod === 'CBE') return `https://apps.cbe.com.et:100/?id=${formData.transactionId}`;
    return '#';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <motion.div 
        layoutId="purchase-flow"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side: Summary */}
        <div className="md:w-5/12 bg-blue-600 p-8 md:p-10 text-white flex flex-col">
          <div className="flex-1">
            <div className="mb-10">
               <img src={event.image_url} className="w-full h-32 object-cover rounded-2xl mb-4 border-2 border-white/20 shadow-lg" alt="" />
               <h2 className="text-2xl font-black mb-2">{typeof event.title === 'string' ? event.title : (event.title as any).en}</h2>
               <div className="space-y-2 opacity-80">
                 <p className="flex items-center gap-2 text-sm font-bold">
                   <Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString()}
                 </p>
                 <p className="flex items-center gap-2 text-sm font-bold">
                   <MapPin className="w-4 h-4" /> {event.location}
                 </p>
               </div>
            </div>

            <div className="space-y-4 pt-10 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold opacity-60 uppercase tracking-widest">{t('quantity')}</span>
                <span className="text-xl font-black">x {quantity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold opacity-60 uppercase tracking-widest">{t('total')}</span>
                <span className="text-3xl font-black">{t('currency')} {totalPrice}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <div className="flex items-center gap-2 text-xs font-bold opacity-40">
              <ShieldCheck className="w-4 h-4" />
              SECURE TRANSACTION
            </div>
          </div>
        </div>

        {/* Right Side: Flow */}
        <div className="md:w-7/12 p-8 md:p-12 relative flex flex-col bg-white">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>

          <div className="flex-1">
            {step === 'quantity' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-gray-900">{t('howManyTickets')}</h3>
                <div className="flex items-center justify-center gap-6 py-10">
                  <Button 
                    variant="outline" 
                    className="h-20 w-20 rounded-3xl text-3xl font-black border-2 border-gray-100"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  > - </Button>
                  <span className="text-6xl font-black w-20 text-center">{quantity}</span>
                  <Button 
                    variant="outline" 
                    className="h-20 w-20 rounded-3xl text-3xl font-black border-2 border-gray-100"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  > + </Button>
                </div>
              </div>
            )}

            {step === 'details' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-gray-900">{t('yourInformation')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('fullName')}</Label>
                    <Input 
                      placeholder="John Doe" 
                      className="rounded-2xl py-6 bg-gray-50 border-transparent font-bold focus:border-blue-500 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('phoneNumber')}</Label>
                    <Input 
                      placeholder="0912345678" 
                      className="rounded-2xl py-6 bg-gray-50 border-transparent font-bold focus:border-blue-500 transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('emailAddress')} ({t('optional')})</Label>
                    <Input 
                      placeholder="john@example.com" 
                      className="rounded-2xl py-6 bg-gray-50 border-transparent font-bold focus:border-blue-500 transition-all"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <h3 className="text-2xl font-black text-gray-900">{t('paymentMethod')}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {[ 
                    { id: 'Telebirr', icon: Smartphone, color: 'bg-green-500' },
                    { id: 'CBE', icon: Banknote, color: 'bg-blue-800' },
                    { id: 'M-Pesa', icon: Smartphone, color: 'bg-red-600' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all ${
                        paymentMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className={`${method.color} p-3 rounded-2xl text-white`}>
                        <method.icon className="w-6 h-6" />
                      </div>
                      <span className="font-black text-lg">{method.id}</span>
                      {paymentMethod === method.id && <CheckCircle2 className="ml-auto text-blue-600 w-6 h-6" />}
                    </button>
                  ))}
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl space-y-4">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('instruction')}</p>
                  <p className="text-sm font-bold text-gray-600">
                    {t('payToAccount')}: <span className="text-gray-900 font-black">0911223344 / 100012345678</span>
                  </p>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('transactionId')}</Label>
                    <Input 
                      placeholder="Enter transaction reference number"
                      className="rounded-2xl py-6 bg-white border-gray-200 font-bold focus:border-blue-500"
                      value={formData.transactionId}
                      onChange={e => setFormData({...formData, transactionId: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'confirmation' && (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-14 h-14 text-green-600" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">{t('orderSubmitted')}</h3>
                <p className="text-gray-500 font-medium mb-8">
                  {t('approvalMessage') || 'Your payment is being verified. You will receive your ticket once approved.'}
                </p>
                <div className="w-full space-y-3">
                   <a 
                    href={getPaymentLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-4 rounded-2xl font-black"
                   >
                     <ExternalLink className="w-4 h-4" /> {t('viewReceipt')}
                   </a>
                   <Button 
                    onClick={onClose}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black"
                   >
                     {t('done')}
                   </Button>
                </div>
              </div>
            )}
          </div>

          {step !== 'confirmation' && (
            <div className="mt-10 pt-6 border-t border-gray-50 flex gap-4">
              {step !== 'quantity' && (
                <Button 
                  variant="ghost" 
                  className="flex-1 py-7 rounded-2xl font-black text-gray-400"
                  onClick={handleBack}
                >
                  <ChevronLeft className="w-5 h-5 mr-1" /> {t('back')}
                </Button>
              )}
              <Button 
                className={`flex-[2] py-7 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-100 transition-all ${isSubmitting ? 'opacity-50' : ''}`}
                onClick={step === 'payment' ? handleSubmitPayment : handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                   <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    {step === 'payment' ? t('confirmPayment') : t('continue')} 
                    <ChevronRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TicketPurchaseFlow;