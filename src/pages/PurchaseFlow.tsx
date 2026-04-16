import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Ticket as TicketIcon,
  CreditCard,
  CheckCircle2,
  Smartphone,
  Building,
  ArrowRight,
  Clock,
  ExternalLink,
  Phone,
  User as UserIcon,
  Mail,
  RefreshCw,
  Download,
  X
} from 'lucide-react';

import { api } from '../lib/api';
import { Event, PaymentMethod, Ticket } from '../types';
import { toast } from 'sonner';
import TicketQR from '../components/TicketQR';
import { jsPDF } from 'jspdf';

const PurchaseFlow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    quantity: 1
  });

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>('Telebirr');

  const [transactionId, setTransactionId] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);

  // ================= LOAD EVENT =================
  useEffect(() => {
    const load = async () => {
      if (!id) return;

      try {
        const data = await api.getEvent(id); // ✅ FIXED
        setEvent(data);
      } catch (err) {
        toast.error('Event not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // ================= STEP 1 =================
  const nextStep = () => {
    if (!formData.fullName || !formData.phone) {
      toast.error('Full name and phone are required');
      return;
    }
    if (formData.quantity < 1) {
      toast.error('Invalid ticket quantity');
      return;
    }
    setStep(2);
  };

  // ================= STEP 2: SUBMIT PAYMENT =================
  const submitPayment = async () => {
    if (!transactionId) {
      toast.error('Transaction ID required');
      return;
    }

    if (!event) return;

    setIsSubmitting(true);

    try {
      // CREATE TICKET (pending state)
      const created = await api.createTicket({
        event_id: event.id,
        user_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        quantity: formData.quantity,
        payment_method: selectedMethod,
        transaction_id: transactionId,
        status: 'pending'
      });

      // SUBMIT PAYMENT RECORD
      await api.submitPayment({
        ticket_id: created.id,
        amount: formData.quantity * event.price,
        method: selectedMethod,
        transaction_id: transactionId
      });

      setTicket(created);
      setStep(3);

      toast.success('Payment submitted. Waiting for admin approval.');
    } catch (err: any) {
      toast.error(err?.message || 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= CHECK STATUS =================
  const checkStatus = async () => {
    if (!ticket) return;

    setIsRefreshing(true);

    try {
      const updated = await api.getTicketById(ticket.id);
      setTicket(updated);

      if (updated.status === 'approved') {
        toast.success('Ticket approved!');
      } else if (updated.status === 'rejected') {
        toast.error('Payment rejected');
      } else {
        toast.info('Still pending approval');
      }
    } catch {
      toast.error('Failed to check status');
    } finally {
      setIsRefreshing(false);
    }
  };

  // ================= PDF =================
  const downloadPDF = () => {
    if (!ticket || ticket.status !== 'approved') return;

    const doc = new jsPDF();
    doc.text("Kistet Addis Ticket", 20, 20);
    doc.text(`Name: ${ticket.user_name}`, 20, 40);
    doc.text(`Event: ${event?.title}`, 20, 50);
    doc.text(`Quantity: ${ticket.quantity}`, 20, 60);
    doc.text(`Ticket ID: ${ticket.id}`, 20, 70);
    doc.save(`ticket-${ticket.id}.pdf`);
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!event) return null;

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* LEFT */}
        <div className="bg-blue-600 md:w-96 p-10 text-white">
          <button onClick={() => navigate(-1)} className="mb-10">
            <ArrowLeft />
          </button>

          <h2 className="text-3xl font-black">{event.title}</h2>

          <div className="mt-10 space-y-6">
            <div>
              <p>Tickets</p>
              <h3 className="text-2xl font-bold">{formData.quantity}</h3>
            </div>

            <div>
              <p>Total</p>
              <h3 className="text-3xl font-black">
                {formData.quantity * event.price} ETB
              </h3>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 p-10">

          <AnimatePresence mode="wait">

            {/* STEP 1 */}
            {step === 1 && (
              <motion.div>
                <h1 className="text-2xl font-bold mb-6">User Info</h1>

                <input
                  placeholder="Full Name"
                  className="input"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />

                <input
                  placeholder="Phone"
                  className="input"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />

                <input
                  type="number"
                  min={1}
                  className="input"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity: Number(e.target.value)
                    })
                  }
                />

                <button onClick={nextStep} className="btn-primary mt-6">
                  Next <ArrowRight />
                </button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div>
                <h1 className="text-2xl font-bold mb-6">Payment</h1>

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
                  className="input"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />

                <button
                  onClick={submitPayment}
                  disabled={isSubmitting}
                  className="btn-primary mt-4"
                >
                  {isSubmitting ? 'Processing...' : 'Submit'}
                </button>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div className="text-center">
                <h1 className="text-2xl font-bold">
                  Status: {ticket?.status}
                </h1>

                {ticket?.status === 'approved' && (
                  <>
                    <TicketQR
                      ticketId={ticket.id}
                      eventId={event.id}
                      userName={ticket.user_name}
                      size={200}
                    />

                    <button onClick={downloadPDF}>
                      Download Ticket
                    </button>
                  </>
                )}

                {ticket?.status !== 'approved' && (
                  <button onClick={checkStatus}>
                    <RefreshCw /> Check Status
                  </button>
                )}

                <button onClick={() => navigate('/')}>
                  Home
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