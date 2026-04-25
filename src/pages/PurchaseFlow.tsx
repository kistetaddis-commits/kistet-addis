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

  const checkStatus = async () => {
    if (!createdTicket) return;
    setIsRefreshing(true);
    try {
      const updated = await api.getTicketById(createdTicket.id);
      setCreatedTicket(updated);
      if (updated.status === 'approved') {
        toast.success('Your ticket has been approved!');
      } else if (updated.status === 'rejected') {
        toast.error('Payment was rejected. Please check with admin.');
      } else {
        toast.info('Still pending approval...');
      }
    } catch (err) {
      toast.error('Failed to check status');
    } finally {
      setIsRefreshing(false);
    }
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

  const getPaymentLink = () => {
    if (!transactionId) return '#';
    switch (selectedMethod) {
      case 'Telebirr':
        return `https://transactioninfo.ethiotelecom.et/receipt/${transactionId}`;
      case 'CBE':
        return `https://apps.cbe.com.et:100/?id=${transactionId}`;
      case 'M-Pesa':
        return `https://mpesa.com/transaction/${transactionId}`;
      default:
        return '#';
    }
  };

  const getLocalizedTitle = () => {
    if (!event) return '';
    if (typeof event.title === 'string') return event.title;
    return (event.title as any)[language] || (event.title as any).en || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row min-h-[700px]">
        {/* Left Panel */}
        <div className="bg-blue-600 md:w-96 p-10 text-white flex flex-col">
          <button onClick={() => navigate(-1)} className="mb-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-grow">
            <div className="bg-white/10 px-4 py-2 rounded-xl w-fit mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest">Event Summary</p>
            </div>
            <h2 className="text-3xl font-black mb-8 leading-tight">
              {getLocalizedTitle()}
            </h2>
            
            <div className="space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <TicketIcon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold opacity-70 uppercase tracking-wider">Quantity</p>
                  <p className="text-2xl font-black">{formData.quantity} Tickets</p>
                </div>
              </div>
              
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold opacity-70 uppercase tracking-wider">Total Amount</p>
<p className="text-4xl font-black">
  {(Number(formData.quantity) || 0) * (Number(event?.ticket_price) || 0)}{" "}
  <span className="text-sm opacity-60">ETB</span>
</p>                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-grow p-8 md:p-16 bg-white overflow-y-auto">
          <div className="flex items-center gap-3 mb-12">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-500 ${step === s ? 'w-16 bg-blue-600' : step > s ? 'w-8 bg-blue-600/30' : 'w-4 bg-gray-100'}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-3">Personal Details</h1>
                  <p className="text-gray-500 font-bold text-lg">We'll use this info to issue your tickets.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <UserIcon className="w-3 h-3" /> Full Name (Required)
                    </label>
                    <input 
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-3xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-lg"
                      placeholder="Abebe Bikila"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Phone className="w-3 h-3" /> Phone Number (Required)
                      </label>
                      <input 
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-3xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-lg"
                        placeholder="+251 9..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email (Optional)
                      </label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-3xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-lg"
                        placeholder="abebe@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Ticket Quantity</label>
                    <div className="flex items-center gap-6 p-2 bg-gray-50 rounded-[2rem]">
                      <button 
                        onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})}
                        className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm hover:bg-gray-100 transition-colors"
                      >-</button>
                      <div className="flex-grow flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-gray-900">{formData.quantity}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Tickets</span>
                      </div>
                      <button 
                        onClick={() => setFormData({...formData, quantity: Math.min(10, formData.quantity + 1)})}
                        className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-3xl shadow-sm hover:bg-gray-100 transition-colors"
                      >+</button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleStep1Submit}
                  className="w-full bg-blue-600 text-white py-8 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
                >
                  Continue to Payment <ArrowRight className="w-7 h-7" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div>
                  <h1 className="text-4xl font-black text-gray-900 mb-3">Payment</h1>
                  <p className="text-gray-500 font-bold text-lg">Pay to our account and submit transaction ID.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[ 
                    { id: 'Telebirr', icon: Smartphone, color: 'bg-blue-600' },
                    { id: 'CBE', icon: Building, color: 'bg-purple-600' },
                    { id: 'M-Pesa', icon: Smartphone, color: 'bg-red-600' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${selectedMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-blue-200'}`}
                    >
                      <div className={`w-14 h-14 ${method.color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg`}>
                        <method.icon className="w-7 h-7" />
                      </div>
                      <p className="font-black text-gray-900 text-sm">{method.id}</p>
                    </button>
                  ))}
                </div>

                <div className="p-8 bg-gray-900 rounded-[2.5rem] text-white space-y-6">
                   <p className="text-4xl font-black">
  {(Number(formData.quantity) || 0) * (Number(event?.price) || 0)}{" "}
  <span className="text-sm opacity-60">ETB</span>
</p>
                   <div className="bg-white/10 p-6 rounded-2xl border border-white/5 space-y-4">
                     <div>
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Account Number</p>
                        <p className="text-3xl font-black text-white">
                          {selectedMethod === 'Telebirr' ? '0911223344' : selectedMethod === 'CBE' ? '100022334455' : '0711223344'}
                        </p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Account Name</p>
                        <p className="text-lg font-bold">Kistet Addis Events PLC</p>
                     </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Enter Transaction ID</label>
                  <input 
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-3xl focus:border-blue-600 focus:bg-white outline-none transition-all font-black text-2xl uppercase tracking-widest text-center"
                    placeholder="TX123456789"
                  />
                  {transactionId && (
                    <a href={getPaymentLink()} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-blue-600 font-bold hover:underline"><ExternalLink className="w-4 h-4" /> Verify Receipt</a>
                  )}
                </div>

                <button 
                  onClick={onSubmit}
                  disabled={isSubmitting || !transactionId}
                  className="w-full bg-blue-600 text-white py-8 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Payment'}
                </button>
                <button onClick={() => setStep(1)} className="w-full text-gray-400 font-bold">Back</button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-10 py-4"
              >
                {createdTicket?.status === 'approved' ? (
                  <div className="space-y-8">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900">Ticket Approved!</h1>
                    <p className="text-gray-500 font-bold">Your ticket is now active and ready to use.</p>
                    
                    <div className="flex justify-center py-6">
                      <TicketQR 
  ticketId={createdTicket.id}
  eventId={event.id}
  size={220}
/>
                    </div>

                    <div className="flex flex-col gap-4 max-w-sm mx-auto">
                      <button 
                        onClick={handleDownloadPDF}
                        className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black flex items-center justify-center gap-3"
                      >
                        <Download className="w-6 h-6" /> Download PDF
                      </button>
                      <button onClick={() => navigate('/')} className="text-gray-400 font-bold">Back to Home</button>
                    </div>
                  </div>
                ) : createdTicket?.status === 'rejected' ? (
                  <div className="space-y-6">
                    <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                      <X className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900">Payment Rejected</h1>
                    <p className="text-gray-500 font-bold">There was an issue with your transaction. Please contact support.</p>
                    <button onClick={() => setStep(2)} className="bg-gray-900 text-white px-8 py-4 rounded-xl font-black">Retry Payment</button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="relative mx-auto w-32 h-32">
                      <div className="absolute inset-0 bg-yellow-100 rounded-full animate-ping opacity-20" />
                      <div className="relative w-32 h-32 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto">
                        <Clock className="w-16 h-16" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-black text-gray-900">Pending Approval</h1>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full font-black text-[10px] uppercase tracking-widest mt-4">
                         Status: {createdTicket?.status.replace('_', ' ')}
                      </div>
                    </div>
                    <p className="text-gray-500 font-bold max-w-xs mx-auto">
                      Admin is verifying your ID: <span className="text-gray-900 font-black">{transactionId}</span>. This takes 5-15 mins.
                    </p>
                    
                    <div className="pt-8 flex flex-col gap-4">
                      <button 
                        onClick={checkStatus}
                        disabled={isRefreshing}
                        className="flex items-center justify-center gap-2 text-blue-600 font-black uppercase text-xs tracking-widest"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Check Approval Status
                      </button>
                      <button onClick={() => navigate('/')} className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black">Back to Home</button>
                    </div>
                  </div>
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