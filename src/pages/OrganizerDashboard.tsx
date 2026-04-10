import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  QrCode, 
  LogOut, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Ticket as TicketIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Event, Ticket } from '../types';
import { toast } from 'sonner';

const OrganizerDashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user: currentUser, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'scanner' | 'stats'>('events');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [qrInput, setQrInput] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const evs = await api.getEvents();
      // For organizers, we might want to filter events they created. 
      // In this demo, we show all if they are admin/organizer.
      setEvents(evs || []);
      if (evs && evs.length > 0) {
        setSelectedEvent(evs[0]);
        // Mocking tickets for now as we don't have a specific endpoint for organizer tickets per event
        // but let's assume getPendingPayments or similar could be used or a new endpoint
        setTickets([]);
      }
    } catch (error) {
      console.error('Error loading organizer data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput) return;

    setIsScanning(true);
    setScanResult(null);
    try {
      const result = await api.scanTicket(qrInput);
      setScanResult(result);
      if (result.success) {
        toast.success(result.message);
        setQrInput('');
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col fixed h-full shadow-sm z-10">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">O</span>
            </div>
            <span className="text-xl font-black text-gray-800 tracking-tight">Organizer</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
              activeTab === 'events' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Events
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
              activeTab === 'scanner' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <QrCode className="w-5 h-5" />
            Scan Tickets
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
              activeTab === 'stats' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Statistics
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 px-4 py-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Logged in as</p>
            <p className="text-sm font-black text-gray-900 truncate">{currentUser?.name || currentUser?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 p-4 md:p-10 pb-24 md:pb-10">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 capitalize">
            {activeTab === 'events' ? 'Assigned Events' : activeTab === 'scanner' ? 'Ticket Scanner' : 'Event Statistics'}
          </h1>
          <p className="text-gray-500">
            {selectedEvent ? `Managing: ${selectedEvent.title}` : 'Select an event to manage'}
          </p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'events' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">Your Events</h3>
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-4 rounded-3xl border transition-all ${
                        selectedEvent?.id === event.id 
                          ? 'bg-white border-blue-600 shadow-lg ring-1 ring-blue-600' 
                          : 'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {event.image_url && <img src={event.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-900 truncate">{event.title}</h4>
                          <div className="flex items-center gap-1 text-xs text-gray-500 font-bold mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                      <h3 className="font-black text-gray-900">Recent Tickets</h3>
                    </div>
                    <div className="p-12 text-center text-gray-400 font-bold">
                      No tickets found for this event
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scanner' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                  <form onSubmit={handleManualScan} className="space-y-6">
                    <input 
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                      placeholder="TICKET-XXXX-XXXX"
                      value={qrInput}
                      onChange={(e) => setQrInput(e.target.value)}
                      required
                    />
                    <button 
                      type="submit"
                      disabled={isScanning}
                      className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg"
                    >
                      {isScanning ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Validate Ticket'}
                    </button>
                  </form>

                  {scanResult && (
                    <div className={`mt-8 p-6 rounded-3xl border ${scanResult.success ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                      <p className="font-black text-lg">{scanResult.message}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default OrganizerDashboard;