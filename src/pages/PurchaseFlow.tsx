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
  Smartphone,
  Building2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { PaymentMethod, Event, PurchaseFormData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 1 | 2 | 3 | 4;
const STORAGE_KEY = 'kistet_purchase_state';

const PurchaseFlow: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PurchaseFormData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.formData || { fullName: '', phone: '', email: '', quantity: 1 };
      } catch {}
    }
    return { fullName: '', phone: '', email: '', quantity: 1 };
  });

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Telebirr');
  const [transactionId, setTransactionId] = useState('');
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  // ================= LOAD EVENT =================
  useEffect(() => {
    const init = async () => {
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
    init();
  }, [id]);

  // ================= STEP HANDLER =================
  const handleNext = async () => {
    if (step === 1) {
      if (!formData.fullName || !formData.phone) {
        toast.error('Please fill required fields');
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
          eventId: id!,            // ✅ FIXED HERE
          userId: "current-user",  // ⚠️ replace with real auth user id
          quantity: formData.quantity,
        });

        setCurrentTicketId(res.ticket_id);
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
    return <div className="text-center p-10">Event not found</div>;
  }

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
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

        {/* STEP CONTENT */}
        <div className="p-6">

          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
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
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: Number(e.target.value),
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
                <p>Select payment method</p>

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
                <p>{transactionId}</p>

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