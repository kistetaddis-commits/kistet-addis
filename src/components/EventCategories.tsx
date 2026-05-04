import React from 'react';
import { motion } from 'framer-motion';
import { 
  Baby, 
  Music, 
  Trophy, 
  Briefcase, 
  PlusCircle,
  LucideIcon,
  ChevronRight
} from 'lucide-react';
import { EventCategory } from '../types';

const iconMap: { [key: string]: LucideIcon } = {
  Baby,
  Music,
  Trophy,
  Briefcase,
  PlusCircle
};

interface EventCategoriesProps {
  categories: EventCategory[];
  onSelect: (slug: string) => void;
  activeCategory: string;
}

const EventCategories: React.FC<EventCategoriesProps> = ({ categories, onSelect, activeCategory }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
      {categories.map((category, index) => {
        const Icon = iconMap[category.icon] || PlusCircle;
        const isActive = activeCategory === category.slug;

        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(isActive ? 'all' : category.slug)}
            className={`relative h-64 md:h-72 rounded-[3rem] overflow-hidden group shadow-2xl transition-all ${
              isActive ? 'ring-8 ring-blue-600/20' : ''
            }`}
          >
            <img 
              src={category.image_url} 
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${
              isActive ? 'from-blue-600/95 via-blue-600/40' : 'from-black/90 via-black/20'
            } to-transparent transition-colors duration-500`} />
            
            <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-white">
              <div className={`mb-6 p-5 rounded-[1.5rem] backdrop-blur-xl border border-white/20 transition-all duration-500 group-hover:bg-white group-hover:text-blue-600 ${
                isActive ? 'bg-white text-blue-600 scale-110' : 'bg-white/10'
              }`}>
                <Icon className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-black text-xl md:text-2xl italic tracking-tight uppercase">{category.name}</h3>
                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-500">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Explore</span>
                   <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            {isActive && (
              <div className="absolute top-6 right-6">
                <div className="w-3 h-3 bg-white rounded-full animate-ping" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

export default EventCategories;