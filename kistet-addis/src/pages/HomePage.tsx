import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Event } from '../types';

const HomePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const data = await api.getEvents();
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
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
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (event.event_type || '').toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      <section className="relative h-[300px] md:h-[450px] overflow-hidden rounded-2xl mx-4 mt-4">
        <img 
          src="https://storage.googleapis.com/dala-prod-public-storage/generated-images/11a7535b-716b-4371-84ef-523ca3f266db/promo-banner-f23acc9b-1774949050106.webp" 
          alt={t('promoBannerAlt')}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent flex items-center p-8">
          <div className="max-w-md text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('heroBannerTitle')}</h1>
            <p className="text-lg mb-6 text-gray-200">{t('heroBannerSubtitle')}</p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-colors">
              {t('exploreNow')}
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 sticky top-16 z-10 bg-white/80 backdrop-blur-md py-4">
        <div className="flex flex-col md:flex-row gap-4 max-w-7xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder={t('searchEvents')}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['all', 'music', 'tech', 'sports'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
                  filter === cat 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? t('allCategories') : t(cat)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 max-w-7xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('upcomingEvents')}</h2>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-bold">{t('loading') || 'Loading events...'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event: Event) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={event.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
              >
                <Link to={`/event/${event.id}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.image_url} 
                      alt={getEventTitle(event)} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-blue-600 font-bold text-sm shadow-sm">
                      {event.event_type}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors line-clamp-1">{getEventTitle(event)}</h3>
                    <div className="flex flex-col gap-2 text-gray-500 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span>{new Date(event.date).toLocaleDateString(language === 'en' ? 'en-US' : 'am-ET')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-2xl font-black text-gray-900">
                        {t('currency')} {event.price}
                      </div>
                      <div className="bg-blue-50 p-2 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        
        {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">{t('eventNotFound')}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;