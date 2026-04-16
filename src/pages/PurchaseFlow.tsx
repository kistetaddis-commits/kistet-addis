import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  CreditCard,
  Phone,
  User,
  Hash
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Event } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 1 | 2 | 3;

const PurchaseFlow: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    quantity: 1,
  });

  const [method, setMethod] = useState<'Telebirr' | 'CBE' | 'M-Pesa'>('Telebirr');
  const [txId, setTxId] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);

  // ================= LOAD EVENT =================
  useEffect(() => {
    (async () => {
      if (!id) return;

      try {
        const data = await api.getEvent(id);
        setEvent(data);
      } catch {
        toast.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ================= STEP VALIDATION =================
  const nextStep = async () => {
    if (step === 1) {
      if (!form.fullName || !form.phone) {
        toast.error('Name and phone are required');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!txId) {
        toast.error('Enter transaction ID');
        return;
      }

      setSubmitting(true);

      try {
        const res = await api.purchaseTicket({
          event_id: id!,
          user_name: form.fullName,
          phone: form.phone,
          email: form.email || null,
          quantity: form.quantity,
          method,
          transaction_id: txId,
          amount: form.quantity * (event?.price || 0),
        });

        setTicketId(res.ticket_id);
        setStep(3);
        toast.success('Payment submitted for approval');
      } catch (err: any) {
        toast.error(err.message || 'Payment failed');
      } finally {
        setSubmitting(false);
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

  // ================= PAYMENT CARDS =================
  const PaymentCard = ({ label, selected, onClick }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between ${
        selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <span className="font-bold">{label}</span>
      {selected && <CheckCircle2 className="text-blue-600" />}
    </button>
  );

  // ================= UI =================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">

      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="font-black text-lg">{event.title}</h2>

          {step < 3 && (
            <button onClick={() => navigate(-1)}>
              <ArrowLeft />
            </button>
          )}
        </div>

        {/* STEP INDICATOR */}
        <div className="flex gap-2 p-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                step >= s ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* CONTENT */}
        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >

                <div className="flex items-center gap-2 font-bold text-gray-700">
                  <User size={18} /> Personal Info
                </div>

                <input
                  placeholder="Full Name *"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                />

                <input
                  placeholder="Phone *"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                />

                <input
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                />

                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="w-full p-3 border rounded-xl"
                />

                <button
                  onClick={nextStep}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >

                <div className="font-bold flex items-center gap-2">
                  <CreditCard size={18} /> Payment Method
                </div>

                <PaymentCard
                  label="Telebirr"
                  selected={method === 'Telebirr'}
                  onClick={() => setMethod('Telebirr')}
                />

                <PaymentCard
                  label="CBE"
                  selected={method === 'CBE'}
                  onClick={() => setMethod('CBE')}
                />

                <PaymentCard
                  label="M-Pesa"
                  selected={method === 'M-Pesa'}
                  onClick={() => setMethod('M-Pesa')}
                />

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <Hash size={18} /> Transaction ID
                  </div>

                  <input
                    value={txId}
                    onChange={(e) => setTxId(e.target.value)}
                    placeholder="Enter transaction ID"
                    className="w-full p-3 border rounded-xl"
                  />
                </div>

                <button
                  onClick={nextStep}
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 rounded-xl font-bold"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" /> Processing
                    </span>
                  ) : (
                    'Submit Payment'
                  )}
                </button>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >

                <Clock className="mx-auto text-blue-600" size={40} />

                <h2 className="font-black text-xl">
                  Waiting for Admin Approval
                </h2>

                <p className="text-gray-500">
                  Your ticket will appear after verification
                </p>

                <div className="bg-gray-100 p-3 rounded-xl font-mono">
                  {ticketId}
                </div>

                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold"
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