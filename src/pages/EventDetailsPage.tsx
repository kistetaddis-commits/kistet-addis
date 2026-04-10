import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Clock, 
  ChevronLeft, 
  Share2, 
  Loader2, 
  Info,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { Event } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import TicketPurchaseFlow from '../components/TicketPurchaseFlow';

const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await api.getEvent(id);
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Event not found');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  const getEventTitle = (event: Event) => {
    if (typeof event.title === 'string') return event.title;
    return (event.title as any)[language] || (event.title as any).en || '';
  };

  const getEventDescription = (event: Event) => {
    if (typeof event.description === 'string') return event.description;
    return (event.description as any)[language] || (event.description as any).en || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-bold">{t('loading') || 'Loading event details...'}</p>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden">
        <img 
          src={event.image_url} 
          alt={getEventTitle(event)} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 rounded-full h-12 w-12"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 rounded-full h-12 w-12"
        >
          <Share2 className="w-5 h-5" />
        </Button>

        <div className="absolute bottom-8 left-8 right-8 text-white">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-blue-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              {event.event_type}
            </span>
            {event.price === 0 && (
              <span className="bg-green-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                {t('free')}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-2">{getEventTitle(event)}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-50 p-4 rounded-2xl">
                    <Calendar className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('dateAndTime')}</p>
                    <p className="text-lg font-black text-gray-900">
                      {new Date(event.date).toLocaleDateString(language === 'en' ? 'en-US' : 'am-ET', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl">
                    <MapPin className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('venue')}</p>
                    <p className="text-lg font-black text-gray-900">{event.location}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Info className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-black text-gray-900">{t('aboutEvent')}</h2>
                </div>
                <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed font-medium">
                  {getEventDescription(event)}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <MapPin className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-black text-gray-900">{t('location')}</h2>
              </div>
              <div className="h-[400px] w-full bg-gray-100 rounded-[2rem] overflow-hidden relative group">
                <img 
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${event.longitude},${event.latitude})/${event.longitude},${event.latitude},14,0/800x400?access_token=YOUR_MAPBOX_TOKEN`} 
                  alt="Location Map"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                <Button className="absolute bottom-6 right-6 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold shadow-lg flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Open in Maps
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 ring-1 ring-blue-500/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-blue-50 px-4 py-2 rounded-xl">
                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest">{t('price')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-400">{t('perTicket')}</span>
                  </div>
                </div>
                
                <div className="text-5xl font-black text-gray-900 mb-8">
                  {t('currency')} {event.price}
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-3 text-gray-500 font-bold bg-gray-50 p-4 rounded-2xl">
                    <Ticket className="w-5 h-5 text-blue-500" />
                    <span>{event.total_tickets - (event.sold_tickets || 0)} {t('ticketsLeft')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 font-bold bg-gray-50 p-4 rounded-2xl">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span>{t('sellingDeadline')}: {new Date(event.selling_deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full py-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-xl shadow-blue-100 transition-all hover:-translate-y-1 active:scale-95"
                  onClick={() => setShowPurchase(true)}
                >
                  {t('buyTicket')}
                </Button>
                
                <p className="text-center mt-6 text-xs text-gray-400 font-bold">
                  Powered by Kistet Addis • Secure Payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPurchase && (
          <TicketPurchaseFlow 
            event={event} 
            onClose={() => setShowPurchase(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventDetailsPage;