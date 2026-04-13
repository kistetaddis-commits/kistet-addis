import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, MapPin, Share2, ArrowLeft, Ticket, CheckCircle2, ExternalLink } from 'lucide-react';
import { MOCK_EVENTS } from '../lib/mockData';
import { Event } from '../types';
import TicketPurchaseFlow from '../components/TicketPurchaseFlow';
import { motion, AnimatePresence } from 'framer-motion';

interface EventDetailsProps {
  eventId: string;
  onBack: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ eventId, onBack }) => {
  const { language, t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    const found = MOCK_EVENTS.find(e => e.id === eventId);
    if (found) setEvent(found as Event);
    window.scrollTo(0, 0);
  }, [eventId]);

  if (!event) return <div className="p-10 text-center">{t('eventNotFound')}</div>;

  const getLocalized = (val: string | { [key: string]: string } | undefined) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return (val as any)[language] || (val as any).en || '';
  };

  const handleShare = () => {
    const title = getLocalized(event.title);
    const description = getLocalized(event.description);

    if (navigator.share) {
      navigator.share({
        title,
        text: description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Sharing link: ' + window.location.href);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Image */}
      <div className="relative h-[350px] md:h-[500px] w-full">
        <img 
          src={event.image_url} 
          alt={getLocalized(event.title)} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        <div className="absolute top-6 left-6">
          <button 
            onClick={onBack}
            className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute bottom-10 left-6 right-6 container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold w-fit mb-4">
              {event.event_type}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
              {getLocalized(event.title)}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">
                {t('aboutEvent')}
              </h2>

              <p className="text-gray-600 leading-relaxed text-lg mb-8">
                {getLocalized(event.description)}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t('date')}</h4>
                    <p className="text-gray-600">
                      {new Date(event.date).toLocaleDateString(
                        language === 'en' ? 'en-US' : 'am-ET',
                        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100 md:col-span-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{t('location')}</h4>
                    <p className="text-gray-600">{event.location}</p>
                    <button className="text-blue-600 text-sm font-semibold hover:underline mt-1 flex items-center gap-1">
                      {t('viewOnMap')} <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Organizer */}
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-4">{t('organizer')}</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500 text-2xl">
                  KA
                </div>
                <div>
                  <h4 className="font-bold text-lg">Kistet Addis Productions</h4>
                  <p className="text-gray-500 text-sm">
                    Organizing top-tier events since 2018
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 ring-4 ring-blue-50">

                <div className="flex items-center justify-between mb-6">
                  <span className="text-gray-500 font-medium">
                    {t('standardTicket')}
                  </span>

                  {/* ✅ FIXED HERE */}
                  <span className="text-3xl font-extrabold text-blue-600">
                    {event.price ?? 0}
                    <span className="text-sm font-medium text-gray-400"> ETB</span>
                  </span>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>{t('instantDelivery')}</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>{t('guaranteedEntry')}</span>
                  </li>
                  <li className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span>{t('refundableMsg')}</span>
                  </li>
                </ul>

                <button 
                  onClick={() => setShowPurchase(true)}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                >
                  <Ticket className="w-6 h-6" />
                  {t('buyTicket')}
                </button>

                <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    !
                  </div>
                  <p className="text-xs text-orange-800 font-medium">
                    {t('limited_tickets_msg')}
                  </p>
                </div>

              </div>

              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 text-gray-600 font-semibold hover:text-blue-600 px-4 py-2"
                >
                  <Share2 className="w-5 h-5" /> {t('shareEvent')}
                </button>
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

export default EventDetails;