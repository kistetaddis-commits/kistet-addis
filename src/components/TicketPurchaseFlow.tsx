import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Check, ChevronRight, Phone, User as UserIcon, Loader2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { PaymentMethod, Event, PurchaseFormData } from '../types';
import { motion } from 'framer-motion';

interface TicketPurchaseFlowProps {
  event?: Event;
  onClose?: () => void;
}

const TicketPurchaseFlow: React.FC<TicketPurchaseFlowProps> = ({ event: propEvent, onClose }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(propEvent || null);
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(!propEvent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<PurchaseFormData>({ fullName: '', phone: '', email: '', quantity: 1 });
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('telebirr');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    const init = async () => {
      if (propEvent) return;
      if (!id) return;
      try {
        const ev = await api.getEventById(id);
        setEvent(ev);
      } catch (error) {
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, propEvent]);

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone) { toast.error('Please fill required fields'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!transactionId) { toast.error('Please enter transaction ID'); return; }
      setIsSubmitting(true);
      try {
        const ticket = await api.createTicket({
          event_id: event?.id || id,
          user_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          quantity: formData.quantity
        });
        
        await api.submitPayment({
          ticket_id: ticket.id,
          method: selectedMethod,
          transaction_id: transactionId,
          amount: formData.quantity * (event?.price || event?.ticket_price || 0)
        });

        setStep(3);
      } catch (error: any) {
        toast.error(error.message || 'Error processing purchase');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
  if (!event) return <div className="p-20 text-center">Event not found</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-8 rounded-3xl space-y-8 relative max-w-lg w-full mx-auto shadow-2xl"
    >
       {onClose && (
         <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100">
           <X className="w-5 h-5 text-gray-500" />
         </button>
       )}

       {step === 1 && (
         <div className="space-y-6">
            <h2 className="text-2xl font-black">Get Your Tickets</h2>
            <div className="space-y-4">
               <input type="text" placeholder="Full Name" className="w-full p-4 border rounded-2xl bg-gray-50" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
               <input type="tel" placeholder="Phone Number" className="w-full p-4 border rounded-2xl bg-gray-50" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
               <button onClick={handleNext} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">Next Step <ChevronRight className="inline w-5 h-5 ml-2" /></button>
            </div>
         </div>
       )}
       {step === 2 && (
          <div className="space-y-6">
             <h2 className="text-2xl font-black">Payment Details</h2>
             <div className="flex gap-2 mb-4">
                {['telebirr', 'cbe_birr', 'mpesa'].map(m => (
                   <button key={m} onClick={() => setSelectedMethod(m as any)} className={`flex-1 py-3 rounded-xl border-2 font-bold ${selectedMethod === m ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}>{m.toUpperCase()}</button>
                ))}
             </div>
             <input type="text" placeholder="Transaction ID" className="w-full p-4 border rounded-2xl bg-gray-50 font-mono" value={transactionId} onChange={e => setTransactionId(e.target.value.toUpperCase())} />
             <button onClick={handleNext} disabled={isSubmitting} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">{isSubmitting ? 'Submitting...' : 'Complete Payment'}</button>
          </div>
       )}
       {step === 3 && (
          <div className="text-center space-y-6">
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"><Check className="w-10 h-10" /></div>
             <h2 className="text-2xl font-black text-gray-900">Request Submitted!</h2>
             <p className="text-gray-500 font-medium">Your payment is being verified by the admin.<br/>You will receive your ticket once approved.</p>
             <button onClick={() => onClose ? onClose() : navigate('/')} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black">{onClose ? 'Close' : 'Back to Home'}</button>
          </div>
       )}
    </motion.div>
  );
};

export default TicketPurchaseFlow;