import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  DollarSign, 
  Type, 
  FileText, 
  Clock, 
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import LocationPicker from '../maps/LocationPicker';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string().min(1, 'Event date is required').refine((val) => {
    return new Date(val) > new Date();
  }, {
    message: 'Event date must be after the current date',
  }),
  location: z.string().min(3, 'Location name is required'),
  latitude: z.number(),
  longitude: z.number(),
  total_tickets: z.number().min(1, 'Total tickets must be greater than 0'),
  price: z.number().min(0, 'Ticket price must be greater than or equal to 0'),
  selling_deadline: z.string().min(1, 'Selling deadline is required'),
  event_type: z.enum(['Kid Program', 'Adult Music', 'Conference', 'Sport']),
  image_url: z.string().optional().or(z.literal('')),
});

type EventFormValues = z.infer<typeof eventSchema>;

const EventForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      latitude: 9.03, // Default Addis Ababa
      longitude: 38.74,
      event_type: 'Adult Music',
      total_tickets: 100,
      price: 0,
    },
  });

  const lat = watch('latitude');
  const lng = watch('longitude');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG)');
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: EventFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      if (!user) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      let finalImageUrl = data.image_url;
      
      if (selectedFile) {
        const uploadRes = await api.uploadImage(selectedFile);
        finalImageUrl = uploadRes.url;
      }

      // Map form fields strictly to DB schema
      await api.createEvent({
        title: data.title,
        description: data.description,
        date: new Date(data.date).toISOString(),
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        price: data.price,
        total_tickets: data.total_tickets,
        selling_deadline: new Date(data.selling_deadline).toISOString(),
        event_type: data.event_type,
        image_url: finalImageUrl || null,
        created_by: user.id,
      });

      toast.success('Event created successfully!');
      
      setTimeout(() => {
        navigate('/admin/dashboard?tab=events');
      }, 1500);
    } catch (error: any) {
      console.error('EventForm: Error creating event:', error);
      toast.error(error.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationChange = (newLat: number, newLng: number) => {
    setValue('latitude', newLat);
    setValue('longitude', newLng);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Essentials</h3>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Event Title</label>
                <input
                  {...register('title')}
                  className={`w-full px-6 py-5 bg-gray-50 border ${errors.title ? 'border-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.5)]' : 'border-gray-100'} rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-lg`}
                  placeholder="e.g. Grand Addis Concert 2024"
                />
                {errors.title && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Description</label>
                <textarea
                  {...register('description')}
                  rows={5}
                  className={`w-full px-6 py-5 bg-gray-50 border ${errors.description ? 'border-red-500' : 'border-gray-100'} rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold resize-none`}
                  placeholder="What makes this event special?"
                />
                {errors.description && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">Event Type</label>
                  <div className="relative">
                    <Type className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <select
                      {...register('event_type')}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="Kid Program">Kid Program</option>
                      <option value="Adult Music">Adult Music</option>
                      <option value="Conference">Conference</option>
                      <option value="Sport">Sport</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">Event Image</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    
                    <AnimatePresence mode="wait">
                      {!previewUrl ? (
                        <motion.div
                          key="upload-button"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-5 px-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-all group"
                        >
                          <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="font-bold text-gray-500 group-hover:text-blue-600">Upload Image</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="preview-area"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="relative w-full aspect-video rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
                        >
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 bg-white text-gray-900 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors"
                            >
                              <ImageIcon className="w-4 h-4" />
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={removeFile}
                              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Timeline & Capacity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">Event Date & Time</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="datetime-local"
                      {...register('date')}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                  {errors.date && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">Ticket Sales Deadline</label>
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="datetime-local"
                      {...register('selling_deadline')}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">Total Tickets Available</label>
                  <div className="relative">
                    <Ticket className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="number"
                      {...register('total_tickets', { valueAsNumber: true })}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                  {errors.total_tickets && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.total_tickets.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">Ticket Price (ETB)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                      placeholder="0 for free entry"
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.price.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 flex-grow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Location</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Venue Name</label>
                <input
                  {...register('location')}
                  className={`w-full px-6 py-5 bg-gray-50 border ${errors.location ? 'border-red-500' : 'border-gray-100'} rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold`}
                  placeholder="e.g. Millennium Hall, Addis Ababa"
                />
                {errors.location && <p className="text-red-500 text-xs font-bold mt-1 ml-1">{errors.location.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Pin Location</label>
                <LocationPicker lat={lat} lng={lng} onChange={handleLocationChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Latitude</p>
                  <p className="text-sm font-black text-gray-900">{lat.toFixed(6)}</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Longitude</p>
                  <p className="text-sm font-black text-gray-900">{lng.toFixed(6)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-50/50 space-y-6">
             <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-7 h-7 animate-spin" /> : <CheckCircle2 className="w-7 h-7" />}
              {isSubmitting ? 'Launching...' : 'Create Event'}
            </button>
            <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              Visible to public immediately
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EventForm;