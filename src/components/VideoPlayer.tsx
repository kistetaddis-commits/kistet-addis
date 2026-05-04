import React from 'react';
import { ExternalLink, Play, Music2, Camera, Send, Globe, MessageSquare } from 'lucide-react';
import { PromotionalVideo } from '../types';
import { motion } from 'framer-motion';

interface VideoPlayerProps {
  video: PromotionalVideo;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video }) => {
  const getEmbedUrl = (url: string, platform: string) => {
    try {
      if (platform === 'youtube') {
        const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return <Play className="w-6 h-6 text-red-600" />;
      case 'tiktok': return <Music2 className="w-6 h-6 text-black" />;
      case 'instagram': return <Camera className="w-6 h-6 text-pink-600" />;
      case 'facebook': return <Globe className="w-6 h-6 text-blue-600" />;
      case 'twitter': return <Send className="w-6 h-6 text-blue-400" />;
      default: return <Play className="w-6 h-6 text-blue-600" />;
    }
  };

  const embedUrl = getEmbedUrl(video.url, video.platform);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-gray-100 group h-full flex flex-col transition-all hover:shadow-2xl hover:-translate-y-1"
    >
      <div className="relative aspect-video bg-gray-900 flex items-center justify-center overflow-hidden">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay" />
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/20 group-hover:scale-110 transition-transform duration-500">
              <Play className="w-10 h-10 fill-current ml-1" />
            </div>
            <div className="z-10">
              <p className="text-white font-black uppercase tracking-[0.2em] text-xs mb-2 opacity-60">Preview on {video.platform}</p>
              <h4 className="text-white text-xl font-black italic line-clamp-2">{video.title}</h4>
            </div>
          </div>
        )}
      </div>
      <div className="p-8 flex-grow flex flex-col">
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-gray-50 rounded-xl">{getPlatformIcon(video.platform)}</div>
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{video.platform}</span>
           {video.is_featured && (
             <span className="ml-auto bg-blue-50 text-blue-600 text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-tighter">Featured</span>
           )}
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-8 line-clamp-2 italic">{video.title}</h3>
        <div className="mt-auto">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-600 transition-all w-full justify-center shadow-lg shadow-gray-200 group-hover:shadow-blue-200"
          >
            Watch on {video.platform.charAt(0).toUpperCase() + video.platform.slice(1)} <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoPlayer;