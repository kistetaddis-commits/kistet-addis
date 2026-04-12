import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Clock
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

  // ================= NEXT =================
  const handleNext = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone) {
        toast.error('Fill required fields');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!transactionId) {
        toast.error('Enter transaction ID');
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await api.purchaseTicket({
          event_id: id!,                       // ✅ FIXED
          user_name: formData.fullName,       // ✅ FIXED
          phone: formData.phone,
          email: formData.email,
          quantity: formData.quantity,
          method: selectedMethod,
          transaction_id: transactionId,
          amount: formData.quantity * (event?.price || 0),
        });

        setTicketId(res.ticket_id);
        setStep(3);

        toast.success('Payment submitted');
      } catch (err: any) {
        toast.error(err.message || 'Error');
      } finally {
        setIsSubmitting(false);
      }
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

  // ================= UI =================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between">
          <h2 className="font-bold">{event.title}</h2>

          {step < 3 && (
            <button onClick={() => navigate(-1)}>
              <ArrowLeft />
            </button>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1">
                <input
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className="input"
                />

                <input
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="input"
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
                  className="input"
                />

                <button onClick={handleNext}>Next</button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2">
                <select
                  value={selectedMethod}
                  onChange={(e) =>
                    setSelectedMethod(e.target.value as PaymentMethod)
                  }
                >
                  <option value="Telebirr">Telebirr</option>
                  <option value="CBE">CBE</option>
                  <option value="M-Pesa">M-Pesa</option>
                </select>

                <input
                  placeholder="Transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />

                <button onClick={handleNext} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Submit'}
                </button>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="step3" className="text-center">
                <Clock className="mx-auto" />
                <h2>Waiting for approval</h2>
                <p className="font-mono">{ticketId}</p>

                <button onClick={() => navigate('/')}>
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