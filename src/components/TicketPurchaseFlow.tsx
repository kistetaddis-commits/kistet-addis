import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Banknote,
  CheckCircle2,
  Loader2,
  Calendar,
  MapPin,
  CheckCircle
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
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>('quantity');
  const [quantity, setQuantity] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    transactionId: '',
  });

  const [paymentMethod, setPaymentMethod] =
    useState<'Telebirr' | 'CBE' | 'M-Pesa'>('Telebirr');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = quantity * (event.price || 0);

  // ================= NEXT STEP =================
  const handleNext = () => {
    if (step === 'quantity') setStep('details');

    else if (step === 'details') {
      if (!formData.name || !formData.phone) {
        toast.error('Please fill required fields');
        return;
      }
      setStep('payment');
    }
  };

  // ================= BACK =================
  const handleBack = () => {
    if (step === 'details') setStep('quantity');
    else if (step === 'payment') setStep('details');
  };

  // ================= SUBMIT =================
  const handleSubmitPayment = async () => {
    if (!formData.transactionId) {
      toast.error('Enter transaction ID');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await api.getMe(); // get logged-in user

      await api.purchaseTicket({
        eventId: event.id,          // ✅ FIXED
        userId: user.id,            // ✅ FIXED
        quantity,
      });

      setStep('confirmation');
      toast.success('Ticket request submitted!');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= UI =================
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">

      {/* BACKDROP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* CARD */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl p-6 z-10"
      >

        {/* CLOSE */}
        <button onClick={onClose} className="absolute top-4 right-4">
          <X />
        </button>

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">{event.title}</h2>
          <p className="text-sm text-gray-500">
            {event.location} • {new Date(event.date).toLocaleDateString()}
          </p>
        </div>

        {/* STEP: QUANTITY */}
        {step === 'quantity' && (
          <div>
            <h3 className="font-bold mb-4">Select Quantity</h3>

            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </button>

              <span className="text-2xl font-bold">{quantity}</span>

              <button onClick={() => setQuantity(quantity + 1)}>
                +
              </button>
            </div>
          </div>
        )}

        {/* STEP: DETAILS */}
        {step === 'details' && (
          <div className="space-y-4">
            <Input
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <Input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />

            <Input
              placeholder="Email (optional)"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
        )}

        {/* STEP: PAYMENT */}
        {step === 'payment' && (
          <div className="space-y-4">

            <div className="flex gap-2">
              <button onClick={() => setPaymentMethod('Telebirr')}>
                Telebirr
              </button>
              <button onClick={() => setPaymentMethod('CBE')}>CBE</button>
              <button onClick={() => setPaymentMethod('M-Pesa')}>M-Pesa</button>
            </div>

            <Input
              placeholder="Transaction ID"
              value={formData.transactionId}
              onChange={(e) =>
                setFormData({ ...formData, transactionId: e.target.value })
              }
            />
          </div>
        )}

        {/* STEP: CONFIRMATION */}
        {step === 'confirmation' && (
          <div className="text-center py-10">
            <CheckCircle className="mx-auto text-green-500 w-16 h-16" />
            <h3 className="text-xl font-bold mt-4">Submitted!</h3>
            <p className="text-gray-500">Waiting for approval</p>
          </div>
        )}

        {/* FOOTER BUTTONS */}
        {step !== 'confirmation' && (
          <div className="flex justify-between mt-6">

            {step !== 'quantity' && (
              <Button onClick={handleBack}>
                <ChevronLeft /> Back
              </Button>
            )}

            <Button
              onClick={
                step === 'payment'
                  ? handleSubmitPayment
                  : handleNext
              }
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Continue <ChevronRight />
                </>
              )}
            </Button>

          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TicketPurchaseFlow;