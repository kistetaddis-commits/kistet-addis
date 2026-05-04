import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, ChevronRight, Loader2, Play, Ticket, Sparkles, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Event, EventCategory, PromotionalVideo } from '../types';
import EventCategories from '../components/EventCategories';
import VideoPlayer from '../components/VideoPlayer';

const HomePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<PromotionalVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const bannerUrl = "https://storage.googleapis.com/dala-prod-public-storage/generated-images/11a7535b-716b-4371-84ef-523ca3f266db/kistet-addis-banner-78f6cc72-1775548074529.webp";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [evs, cats, vids] = await Promise.all([
          api.getEvents(),
          api.getCategories(),
          api.getVideos({ featured: true })
        ]);
        setEvents(evs || []);
        setCategories(cats || []);
        setFeaturedVideos(vids || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
    <div className="flex flex-col gap-12 pb-24 bg-white">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[800px] overflow-hidden rounded-b-[4rem] md:rounded-b-[8rem] shadow-3xl">
        <img 
          src={bannerUrl} 
          alt="Kistet Addis"
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8 md:p-24">
          <div className="max-w-4xl text-white">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                    <Sparkles className="w-6 h-6 text-white" />
                 </div>
                 <span className="text-sm font-black uppercase tracking-[0.4em] text-blue-400">The Ultimate Event Hub</span>
              </div>
              <h1 className="text-6xl md:text-[9rem] font-black mb-10 italic tracking-tighter leading-[0.85]">
                {t('heroBannerTitle') || 'DISCOVER ADDIS'}
              </h1>
              <p className="text-xl md:text-3xl mb-14 text-gray-300 font-medium max-w-2xl leading-relaxed">
                Experience the heartbeat of Ethiopia through its finest gatherings and cultural celebrations.
              </p>
              <div className="flex flex-wrap gap-6">
                <button 
                  onClick={() => document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-3xl font-black text-xl transition-all shadow-2xl shadow-blue-600/40 hover:-translate-y-2"
                >
                  Explore Events
                </button>
                <Link to="/my-tickets" className="bg-white/10 backdrop-blur-2xl hover:bg-white/20 text-white px-12 py-6 rounded-3xl font-black text-xl border border-white/20 transition-all flex items-center gap-3 hover:-translate-y-2">
                  <Ticket className="w-7 h-7" /> My Tickets
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="px-6 max-w-[1400px] mx-auto w-full py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-1 bg-blue-600 rounded-full" />
               <p className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs">Explore by Type</p>
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 italic tracking-tighter uppercase">Categories</h2>
          </div>
          <p className="text-gray-400 font-bold max-w-sm">
            Filter through our curated list of events to find exactly what you're looking for.
          </p>
        </div>
        <EventCategories 
          categories={categories} 
          onSelect={setFilter} 
          activeCategory={filter} 
        />
      </section>

      {/* Search & Discovery */}
      <section id="search-section" className="px-6 sticky top-24 z-40 py-8 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600/5 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 w-8 h-8 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder={t('searchEvents') || 'Search events, locations...'}
              className="w-full pl-20 pr-10 py-8 rounded-[3rem] border-2 border-gray-50 bg-white/90 backdrop-blur-2xl shadow-3xl focus:ring-8 focus:ring-blue-100 focus:border-blue-200 outline-none transition-all font-black text-xl italic"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
               <div className="bg-gray-100 p-4 rounded-full text-gray-400"><Filter className="w-6 h-6" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="px-6 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6 border-b border-gray-50 pb-12">
          <h2 className="text-4xl font-black text-gray-900 italic uppercase tracking-tighter">
            {filter === 'all' ? (t('upcomingEvents') || 'Upcoming Events') : `${filter} Collection`}
          </h2>
          <div className="flex items-center gap-4 bg-gray-50 px-8 py-3 rounded-full border border-gray-100 shadow-inner">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-gray-500 font-black text-sm uppercase tracking-widest">{filteredEvents.length} LIVE NOW</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8 bg-gray-50/50 rounded-[4rem] shadow-inner">
            <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
            <p className="text-gray-400 font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Events...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <AnimatePresence mode='popLayout'>
              {filteredEvents.map((event: Event) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={event.id} 
                  className="bg-white rounded-[3.5rem] overflow-hidden shadow-xl hover:shadow-4xl transition-all group border border-gray-50 flex flex-col"
                >
                  <Link to={`/event/${event.id}`} className="flex flex-col h-full">
                    <div className="relative h-80 overflow-hidden">
                      <img 
                        src={event.image_url} 
                        alt={getEventTitle(event)} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                         <span className="text-white font-black text-xs uppercase tracking-[0.3em]">Discover More</span>
                      </div>
                      <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-xl px-6 py-2 rounded-2xl text-blue-600 font-black text-xs shadow-2xl uppercase tracking-[0.2em]">
                        {event.event_type}
                      </div>
                    </div>
                    <div className="p-10 flex-grow flex flex-col">
                      <h3 className="text-3xl font-black mb-6 group-hover:text-blue-600 transition-colors line-clamp-2 italic tracking-tight leading-tight uppercase">{getEventTitle(event)}</h3>
                      <div className="flex flex-col gap-5 text-gray-500 font-bold text-sm mb-12">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500"><Calendar className="w-5 h-5" /></div>
                          <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><MapPin className="w-5 h-5" /></div>
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-8 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry From</p>
                          <div className="text-4xl font-black text-gray-900">
                            {event.price} <span className="text-sm text-blue-600 tracking-tighter">ETB</span>
                          </div>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-[1.5rem] text-white group-hover:bg-blue-600 transition-all shadow-xl group-hover:shadow-blue-200">
                          <ChevronRight className="w-7 h-7" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center py-40 bg-gray-50/50 rounded-[4rem] shadow-inner border-2 border-dashed border-gray-100">
            <Search className="w-24 h-24 mx-auto mb-8 text-gray-100" />
            <p className="text-3xl font-black text-gray-400 italic uppercase">No Matches Found</p>
            <p className="text-gray-400 font-medium mt-4">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </section>

      {/* Featured Videos Section */}
      {featuredVideos.length > 0 && (
        <section className="bg-gray-900 py-32 px-6 rounded-[4rem] md:rounded-[8rem] mx-4">
          <div className="max-w-[1400px] mx-auto w-full">
            <div className="flex flex-col items-center mb-24 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white mb-10 shadow-3xl shadow-blue-500/20"
              >
                <Play className="w-10 h-10 fill-current ml-1" />
              </motion.div>
              <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-none mb-6">Event <br />Highlights</h2>
              <div className="w-20 h-1.5 bg-blue-600 rounded-full mb-8" />
              <p className="text-gray-400 text-xl md:text-2xl font-medium max-w-2xl">Catch the energy and excitement from our premier event collection.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {featuredVideos.map((video) => (
                <VideoPlayer key={video.id} video={video} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;