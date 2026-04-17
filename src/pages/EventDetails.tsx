import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  Calendar,
  MapPin,
  Share2,
  ArrowLeft,
  Ticket,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { MOCK_EVENTS } from '../lib/mockData';
import { Event } from '../types';
import TicketPurchaseFlow from '../components/TicketPurchaseFlow';
import { AnimatePresence } from 'framer-motion';

interface EventDetailsProps {
  eventId: string;
  onBack: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ eventId, onBack }) => {
  const { language, t } = useLanguage();
  const [event, setEvent] = useState<Event | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);

  // ================= LOAD EVENT =================
  useEffect(() => {
    if (!eventId) return;

    const found = MOCK_EVENTS.find((e) => e.id === eventId) || null;
    setEvent(found);

    window.scrollTo(0, 0);
  }, [eventId]);

  // ================= SAFE LOCALIZATION =================
  const getLocalized = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;

    return val?.[language] || val?.en || '';
  };

  // ================= SHARE =================
  const handleShare = async () => {
    if (!event) return;

    const title = getLocalized(event.title);
    const description = getLocalized(event.description);

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: description,
          url: window.location.href,
        });
      } else {
        alert(window.location.href);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  // ================= LOADING STATE =================
  if (!event) {
    return (
      <div className="p-10 text-center text-gray-600">
        {t('eventNotFound')}
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="relative h-[350px] md:h-[500px] w-full">
        <img
          src={event.image_url}
          alt={getLocalized(event.title)}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* BACK BUTTON */}
        <div className="absolute top-6 left-6">
          <button
            onClick={onBack}
            className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* TITLE */}
        <div className="absolute bottom-10 left-6 right-6">
          <div className="max-w-4xl">
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold w-fit mb-4">
              {event.event_type}
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              {getLocalized(event.title)}
            </h1>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="container mx-auto px-4 -mt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* DESCRIPTION */}
            <div className="bg-white rounded-3xl p-6 md:p-10 border">
              <h2 className="text-2xl font-bold mb-6 border-b pb-4">
                {t('aboutEvent')}
              </h2>

              <p className="text-gray-600 text-lg mb-8">
                {getLocalized(event.description)}
              </p>

              {/* DATE + LOCATION */}
              <div className="grid md:grid-cols-2 gap-6">

                <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl">
                  <Calendar className="text-blue-600" />
                  <div>
                    <h4 className="font-bold">{t('date')}</h4>
                    <p>
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl md:col-span-2">
                  <MapPin />
                  <div>
                    <h4 className="font-bold">{t('location')}</h4>
                    <p>{event.location}</p>

                    <button className="text-blue-600 text-sm flex items-center gap-1 mt-1">
                      {t('viewOnMap')} <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ORGANIZER */}
            <div className="bg-white rounded-3xl p-6 md:p-10 border">
              <h3 className="text-xl font-bold mb-4">
                {t('organizer')}
              </h3>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center font-bold">
                  KA
                </div>

                <div>
                  <h4 className="font-bold text-lg">
                    Kistet Addis Productions
                  </h4>
                  <p className="text-gray-500 text-sm">
                    Organizing top-tier events
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <div>
            <div className="sticky top-24 bg-white rounded-3xl p-6 border shadow-xl">

              <div className="flex justify-between mb-6">
                <span>{t('standardTicket')}</span>

                <span className="text-3xl font-bold text-blue-600">
                  {event.price ?? 0} ETB
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex gap-2">
                  <CheckCircle2 className="text-green-500" />
                  {t('instantDelivery')}
                </li>

                <li className="flex gap-2">
                  <CheckCircle2 className="text-green-500" />
                  {t('guaranteedEntry')}
                </li>
              </ul>

              <button
                onClick={() => setShowPurchase(true)}
                className="w-full bg-blue-600 text-white py-4 rounded-xl flex items-center justify-center gap-2"
              >
                <Ticket /> {t('buyTicket')}
              </button>

              <div className="mt-4 text-xs text-orange-700 bg-orange-50 p-3 rounded-xl">
                {t('limited_tickets_msg')}
              </div>

            </div>

            {/* SHARE */}
            <div className="flex justify-center mt-4">
              <button
                onClick={handleShare}
                className="flex gap-2 text-gray-600 hover:text-blue-600"
              >
                <Share2 /> {t('shareEvent')}
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL */}
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