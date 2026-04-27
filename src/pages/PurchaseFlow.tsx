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
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { Event, PurchaseFormData, PaymentMethod, Ticket } from '../types';
import { toast } from 'sonner';
import TicketQR from '../components/TicketQR';
import { jsPDF } from 'jspdf';

const PurchaseFlow: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [event, setEvent] = useState<Event | null>(null);
  const [step, setStep] = useState(1);
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

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Telebirr');
  const [transactionId, setTransactionId] = useState('');
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const data = await api.getEventById(id);
        setEvent(data);
      } catch (err) {
        toast.error('Event not found');
        navigate('/');
      }
    };
    fetchEvent();
  }, [id, navigate]);

  if (!event) return null;

  // ✅ SAFE TOTAL CALCULATION (FIXED)
  const quantity = Number(formData?.quantity ?? 0);
const price = Number(event?.price ?? 0);
const total = quantity * price;

  const handleStep1Submit = () => {
    if (!formData.fullName || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    setStep(2);
  };

  const onSubmit = async () => {
    if (!transactionId) {
      toast.error('Please enter the transaction ID');
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
        transaction_id: transactionId
      });

      setCreatedTicket(ticket);
      setStep(3);
      toast.success('Ticket submitted for approval');
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocalizedTitle = () => {
    if (!event) return "Unknown Event";
    if (typeof event.title === "string") return event.title;
    return event.title?.[language] || event.title?.en || "Unknown Event";
  };

  const handleDownloadPDF = () => {
    if (!createdTicket || createdTicket.status !== 'approved' || !event) return;

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Kistet Addis - Official Ticket', 20, 30);
    doc.setFontSize(14);
    doc.text(`Event: ${getLocalizedTitle()}`, 20, 50);
    doc.text(`Buyer: ${createdTicket.user_name}`, 20, 60);
    doc.text(`Quantity: ${createdTicket.quantity}`, 20, 70);
    doc.text(`Ticket ID: ${createdTicket.id}`, 20, 80);
    doc.text(`Status: ${createdTicket.status.toUpperCase()}`, 20, 90);
    doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 20, 105);
    doc.text('Instructions: Present the QR code at the entrance.', 20, 120);
    doc.save(`ticket-${createdTicket.id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">

        {/* LEFT PANEL */}
        <div className="bg-blue-600 md:w-96 p-10 text-white flex flex-col">

          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-7 h-7" />
            </div>

            <div>
              <p className="text-xs font-bold opacity-70 uppercase tracking-wider">
                Total Amount
              </p>

              {/* ✅ FIXED TOTAL (NO NaN POSSIBLE) */}
              <p className="text-4xl font-black">
                {total}{" "}
                <span className="text-sm opacity-60">ETB</span>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (UNCHANGED UI BELOW) */}
        <div className="flex-grow p-8 md:p-16 bg-white overflow-y-auto">
          <AnimatePresence mode="wait">

            {step === 1 && (
              <motion.div className="space-y-10">
                <h1 className="text-4xl font-black">Personal Details</h1>

                <input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Full Name"
                  className="w-full p-4 bg-gray-100 rounded-xl"
                />

                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone"
                  className="w-full p-4 bg-gray-100 rounded-xl"
                />

                <button onClick={handleStep1Submit} className="bg-blue-600 text-white px-6 py-4 rounded-xl">
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div className="space-y-10">
                <h1 className="text-3xl font-black">Payment</h1>

                {/* ✅ SAFE TOTAL DISPLAY */}
                <p className="text-3xl font-black">
                  {total} ETB
                </p>

                <input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Transaction ID"
                  className="w-full p-4 bg-gray-100 rounded-xl"
                />

                <button onClick={onSubmit} className="bg-blue-600 text-white px-6 py-4 rounded-xl">
                  Submit Payment
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div className="text-center space-y-6">
                <h1 className="text-3xl font-black">Status</h1>

                {createdTicket?.status === 'approved' && (
                  <>
                    <TicketQR ticketId={createdTicket.id} eventId={event.id} size={200} />
                    <button onClick={handleDownloadPDF} className="bg-green-600 text-white px-6 py-4 rounded-xl">
                      Download PDF
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PurchaseFlow;