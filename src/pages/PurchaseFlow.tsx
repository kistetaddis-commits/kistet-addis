import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Event, PaymentMethod } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 1 | 2 | 3;

const PurchaseFlow: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    quantity: 1,
  });

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>('Telebirr');

  const [transactionId, setTransactionId] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);

  // ================= LOAD EVENT =================
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        const ev = await api.getEvent(id);
        setEvent(ev);
      } catch {
        toast.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // ================= VALIDATION =================
  const validateStep1 = () => {
    if (!formData.fullName.trim()) return 'Full name required';
    if (!formData.phone.trim()) return 'Phone required';
    if (formData.quantity < 1) return 'Invalid quantity';
    return null;
  };

  const validateStep2 = () => {
    if (!transactionId.trim()) return 'Transaction ID required';
    return null;
  };

  // ================= NEXT =================
  const handleNext = async () => {
    if (step === 1) {
      const error = validateStep1();
      if (error) return toast.error(error);
      setStep(2);
      return;
    }

    if (step === 2) {
      const error = validateStep2();
      if (error) return toast.error(error);

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
          amount: formData.quantity * (event?.ticket_price || 0),
        });

        setTicketId(res.ticket?.id || res.ticket_id);
        setStep(3);

        toast.success('Payment submitted successfully');
      } catch (err: any) {
        toast.error(err.message || 'Payment failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ================= PAYMENT LINKS =================
  const getPaymentLink = () => {
    if (!transactionId) return '';

    switch (selectedMethod) {
      case 'Telebirr':
        return `https://transactioninfo.ethiotelecom.et/receipt/${transactionId}`;
      case 'CBE':
        return `https://apps.cbe.com.et:100/?id=${transactionId}`;
      case 'M-Pesa':
        return `https://mpesa.com/transaction/${transactionId}`;
      default:
        return '';
    }
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!event) {
    return <div className="p-10 text-center">Event not found</div>;
  }

  const totalPrice = formData.quantity * (event.ticket_price || 0);

  // ================= UI =================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">{event.title}</h2>

          {step < 3 && (
            <button onClick={() => navigate(-1)}>
              <ArrowLeft />
            </button>
          )}
        </div>

        {/* BODY */}
        <div className="p-6">

          {/* STEP INDICATOR */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  step >= s ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" className="space-y-4">

                <input
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl"
                />

                <input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl"
                />

                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-3 border rounded-xl"
                />

                <input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 border rounded-xl"
                />

                <div className="font-bold">
                  Total: {totalPrice} ETB
                </div>

                <button
                  onClick={handleNext}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl"
                >
                  Next
                </button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" className="space-y-4">

                <div className="p-4 bg-gray-50 rounded-xl text-sm">
                  <p className="font-bold mb-2">Payment Methods</p>

                  <p>Telebirr: {getPaymentLink()}</p>
                  <p>CBE: {getPaymentLink()}</p>
                  <p>M-Pesa: {getPaymentLink()}</p>
                </div>

                <select
                  value={selectedMethod}
                  onChange={(e) =>
                    setSelectedMethod(e.target.value as PaymentMethod)
                  }
                  className="w-full p-3 border rounded-xl"
                >
                  <option value="Telebirr">Telebirr</option>
                  <option value="CBE">CBE</option>
                  <option value="M-Pesa">M-Pesa</option>
                </select>

                <input
                  placeholder="Transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full p-3 border rounded-xl"
                />

                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 rounded-xl"
                >
                  {isSubmitting ? 'Processing...' : 'Submit Payment'}
                </button>

              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="step3" className="text-center space-y-4">

                <Clock className="mx-auto w-10 h-10 text-blue-600" />

                <h2 className="font-bold text-lg">
                  Waiting for Admin Approval
                </h2>

                <p className="text-sm text-gray-500">
                  Your ticket will be issued after approval
                </p>

                <div className="p-3 bg-gray-100 rounded-xl font-mono">
                  Ticket ID: {ticketId}
                </div>

                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl"
                >
                  Go Home
                </button>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PurchaseFlow;