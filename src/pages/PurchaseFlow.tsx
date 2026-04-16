import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { Event, PaymentMethod } from '../types';
import { toast } from 'sonner';
import TicketQR from '../components/TicketQR';

const PurchaseFlow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    quantity: 1
  });

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>('Telebirr');

  const [transactionId, setTransactionId] = useState('');
  const [ticket, setTicket] = useState<any>(null);

  // ================= LOAD EVENT =================
  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;

      try {
        const data = await api.getEvent(id);
        setEvent(data);
      } catch {
        toast.error('Event not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [id, navigate]);

  // ================= STEP 1 =================
  const handleNext = () => {
    if (!formData.fullName || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    if (formData.quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    setStep(2);
  };

  // ================= STEP 2 =================
  const handleSubmit = async () => {
    if (!transactionId) {
      toast.error('Enter transaction ID');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.purchaseTicket({
        event_id: id,
        user_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        quantity: formData.quantity,
        method: selectedMethod,
        transaction_id: transactionId,
        amount: formData.quantity * (event?.price || 0)
      });

      setTicket(res);
      setStep(3);

      toast.success('Payment submitted. Waiting for approval');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= PAYMENT LINK =================
  const getPaymentLink = () => {
    if (!transactionId) return '#';

    if (selectedMethod === 'Telebirr') {
      return `https://transactioninfo.ethiotelecom.et/receipt/${transactionId}`;
    }

    if (selectedMethod === 'CBE') {
      return `https://apps.cbe.com.et:100/?id=${transactionId}`;
    }

    return `https://mpesa.com/transaction/${transactionId}`;
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock className="animate-spin w-10 h-10 text-blue-600" />
      </div>
    );
  }

  if (!event) return null;

  // ================= UI =================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl p-8">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg">{event.title}</h2>
          {step < 3 && (
            <button onClick={() => navigate(-1)}>
              <ArrowLeft />
            </button>
          )}
        </div>

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
                placeholder="Email (optional)"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
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
                    quantity: Number(e.target.value)
                  })
                }
                className="input"
              />

              <button onClick={handleNext} className="btn">
                Next
              </button>
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
                className="input"
              >
                <option value="Telebirr">Telebirr</option>
                <option value="CBE">CBE</option>
                <option value="M-Pesa">M-Pesa</option>
              </select>

              <input
                placeholder="Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="input"
              />

              {transactionId && (
                <a
                  href={getPaymentLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  Verify Payment
                </a>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div key="step3" className="text-center">

              {ticket?.status === 'approved' ? (
                <>
                  <CheckCircle2 className="mx-auto text-green-500" />
                  <h2>Approved</h2>

                  <TicketQR
                    ticketId={ticket.id}
                    eventId={event.id}
                    size={200}
                  />
                </>
              ) : ticket?.status === 'rejected' ? (
                <>
                  <X className="mx-auto text-red-500" />
                  <h2>Rejected</h2>
                </>
              ) : (
                <>
                  <Clock className="mx-auto" />
                  <h2>Waiting for approval</h2>
                  <p className="font-mono">{transactionId}</p>
                </>
              )}

              <button onClick={() => navigate('/')} className="btn mt-4">
                Go Home
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default PurchaseFlow;