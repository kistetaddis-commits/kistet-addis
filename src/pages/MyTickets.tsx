import React, { useState, useRef } from 'react';
import { Search, Ticket as TicketIcon, Download, Loader2, Calendar, MapPin, Clock, ShieldCheck, QrCode as QrIcon } from 'lucide-react';
import { api } from '../lib/api';
import { Ticket } from '../types';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import TicketQR from '../components/TicketQR';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';

const MyTickets: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await api.getMyTickets({ 
        phone: identifier, 
        email: identifier.includes('@') ? identifier : undefined 
      });
      setTickets(data);
      if (data.length === 0) {
        toast.info('No tickets found for this contact information.');
      }
    } catch (error: any) {
      toast.error('Failed to fetch tickets.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTicket = async (ticket: Ticket) => {
    const element = document.getElementById(`ticket-design-${ticket.id}`);
    if (!element) return;

    setIsDownloading(ticket.id);
    try {
      // Wait a tiny bit for any layout adjustments
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(element, {
        scale: 3, // High quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const link = document.createElement('a');
      link.download = `KistetAddis-Ticket-${ticket.id.slice(0, 8)}.png`;
      link.href = imgData;
      link.click();
      
      toast.success('Ticket downloaded successfully!');
    } catch (error) {
      console.error('Download failed', error);
      toast.error('Failed to download ticket.');
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gray-900 text-white py-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 blur-[150px] -ml-48 -mt-48 rounded-full" />
           <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 blur-[150px] -mr-48 -mb-48 rounded-full" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-8xl font-black mb-8 italic tracking-tight uppercase">Find Your Tickets</h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              Enter the phone number or email used during purchase to access your digital passes.
            </p>
          </motion.div>
          
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSearch} 
            className="max-w-xl mx-auto relative"
          >
            <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-3 flex items-center border border-white/10 shadow-3xl">
              <div className="pl-6 text-blue-500"><Search className="w-7 h-7" /></div>
              <input 
                type="text" 
                placeholder="Phone or Email Address" 
                className="flex-1 bg-transparent border-none outline-none p-5 text-white font-black text-xl placeholder:text-gray-600"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] py-8 px-10 font-black text-xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                Search
              </Button>
            </div>
          </motion.form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-8 bg-white rounded-[4rem] shadow-2xl border border-gray-100">
            <div className="relative">
               <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
               <TicketIcon className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400 font-black uppercase tracking-[0.3em] animate-pulse">Searching for tickets</p>
          </div>
        ) : hasSearched && tickets.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 bg-white rounded-[4rem] shadow-2xl border border-gray-100 px-8"
          >
             <div className="w-28 h-28 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-10 text-gray-300">
                <TicketIcon className="w-14 h-14" />
             </div>
             <h3 className="text-3xl font-black text-gray-900 mb-4">No Tickets Found</h3>
             <p className="text-gray-500 font-medium max-w-md mx-auto">We couldn't find any tickets matching that contact information. Please check your entry and try again.</p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {tickets.map((ticket, index) => (
              <motion.div 
                key={ticket.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col gap-6"
              >
                {/* Main Visible Card */}
                <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row">
                   <div className="flex-1 p-10 md:p-16">
                      <div className="flex flex-wrap items-center gap-4 mb-10">
                         <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest ${ 
                           ticket.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                         }`}>
                           {ticket.status.replace('_', ' ')}
                         </div>
                         <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Serial: {ticket.id.slice(0, 12)}</span>
                      </div>
                      
                      <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-10 italic leading-tight">{ticket.event_name}</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Calendar className="w-7 h-7" /></div>
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                               <p className="text-lg font-black">{new Date(ticket.event_date || '').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600"><TicketIcon className="w-7 h-7" /></div>
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantity</p>
                               <p className="text-lg font-black">{ticket.quantity} Person(s)</p>
                            </div>
                         </div>
                      </div>

                      <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600"><MapPin className="w-7 h-7" /></div>
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Venue</p>
                            <p className="text-lg font-black">{ticket.event_location}</p>
                         </div>
                      </div>
                   </div>
                   
                   <div className="w-full md:w-80 bg-gray-50/50 border-t md:border-t-0 md:border-l border-dashed border-gray-200 p-10 flex flex-col items-center justify-center gap-8">
                      {ticket.status === 'approved' && ticket.qr_code ? (
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl">
                           <TicketQR 
                             ticketId={ticket.id} 
                             eventId={ticket.eventId} 
                             userName={ticket.user_name} 
                             size={180} 
                           />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-6 py-10 opacity-50">
                           <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                              <Clock className="w-10 h-10" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pending Payment</p>
                              <p className="text-[10px] font-bold text-gray-400">Verification in progress</p>
                           </div>
                        </div>
                      )}
                      <Button 
                        onClick={() => downloadTicket(ticket)}
                        disabled={ticket.status !== 'approved' || isDownloading === ticket.id}
                        className="w-full bg-gray-900 hover:bg-blue-600 text-white rounded-2xl py-8 font-black text-lg shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isDownloading === ticket.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Download className="w-6 h-6 mr-2" /> Save Ticket</>}
                      </Button>
                   </div>
                </div>

                {/* Hidden Layout for Download (Design) */}
                <div 
                  id={`ticket-design-${ticket.id}`} 
                  className="fixed -left-[2000px] w-[800px] bg-white rounded-[3rem] overflow-hidden border-8 border-gray-900"
                >
                   <div className="p-16 flex flex-col md:flex-row">
                      <div className="flex-1 pr-12">
                         <div className="flex items-center gap-4 mb-10">
                            <div className="bg-blue-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">OFFICIAL TICKET</div>
                            <div className="text-[10px] font-black text-gray-400 uppercase">ID: {ticket.id}</div>
                         </div>
                         <h1 className="text-6xl font-black text-gray-900 mb-12 italic leading-none">{ticket.event_name}</h1>
                         
                         <div className="grid grid-cols-2 gap-12 mb-12">
                            <div className="space-y-2">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                               <p className="text-2xl font-black">{new Date(ticket.event_date || '').toLocaleDateString()}</p>
                            </div>
                            <div className="space-y-2">
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</p>
                               <p className="text-2xl font-black">{ticket.quantity} Person(s)</p>
                            </div>
                         </div>
                         
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee</p>
                            <p className="text-2xl font-black text-blue-600">{ticket.user_name}</p>
                         </div>

                         <div className="mt-12 flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            <p className="text-xs font-bold text-gray-500">This ticket is verified by Kistet Addis Ticketing System</p>
                         </div>
                      </div>
                      
                      <div className="w-64 flex flex-col items-center justify-center border-l-2 border-dashed border-gray-200 pl-12">
                         <div className="mb-6 p-4 border-4 border-gray-900 rounded-3xl">
                            <TicketQR 
                               ticketId={ticket.id} 
                               eventId={ticket.eventId} 
                               userName={ticket.user_name} 
                               size={200} 
                            />
                         </div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scan at Entrance</p>
                      </div>
                   </div>
                   <div className="bg-gray-900 text-white p-8 flex justify-between items-center">
                      <div className="font-black italic text-2xl tracking-tighter">KISTET ADDIS</div>
                      <div className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Your Gateway to Addis Events</div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;