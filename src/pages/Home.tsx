import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, Ticket as TicketIcon, Loader2 } from 'lucide-react';
import { getAllEvents } from '../lib/api';
import EventCard from '../components/EventCard';
import { motion } from 'framer-motion';
import { Event } from '../types';
import { toast } from 'sonner';

interface HomeProps {
  onEventClick: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ onEventClick }) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['All', 'Concerts', 'Conferences', 'Cultural'];

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const data = await getAllEvents();
        setEvents(data);
      } catch (error) {
        console.error('Home page fetch error:', error);
        toast.error('Failed to load events. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getEventTitle = (event: Event) => {
    if (typeof event.title === 'string') return event.title;
    return (event.title as any)[language] || (event.title as any).en || '';
  };

  const filteredEvents = events.filter(event => {
    const title = getEventTitle(event);
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || event.event_type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Banner */}
      <section className="relative h-[400px] md:h-[500px] flex items-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80"
            className="w-full h-full object-cover opacity-50"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl text-white"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              {t('heroTitle').split(':').map((part: string, i: number) => (
                <React.Fragment key={i}>
                   {i === 1 ? <><br /><span className="text-orange-500">{part}</span></> : part}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-lg">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30">
                {t('exploreEvents')}
              </button>
              <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
                <TicketIcon className="w-5 h-5 text-orange-400" />
                <span className="font-medium">{t('ticketsSold')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text"
                placeholder={t('searchEvents')}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none border transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'All' ? t('allCategories') : t(cat.toLowerCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <section className="container mx-auto px-4 mt-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('upcomingEvents')}</h2>
            <div className="h-1.5 w-20 bg-orange-500 rounded-full" />
          </div>
          <button className="text-blue-600 font-bold hover:underline">{t('viewAll')}</button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold">Loading events...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <EventCard 
                    event={event} 
                    onClick={() => onEventClick(event.id)} 
                  />
                </motion.div>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-500 text-xl font-medium">{t('noEventsFound')}</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Home;