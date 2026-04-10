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

import { createEvent, uploadImage } from '../../lib/api';
import { toast } from 'sonner';
import LocationPicker from '../maps/LocationPicker';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ================= VALIDATION =================
const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),

  date: z.string().min(1, 'Event date is required'),

  location: z.string().min(3, 'Location name is required'),
  latitude: z.number(),
  longitude: z.number(),

  total_tickets: z.number().min(1, 'Total tickets must be greater than 0'),
  ticket_price: z.number().min(0, 'Ticket price must be greater than or equal to 0'),

  selling_deadline: z.string().min(1, 'Selling deadline is required'),

  event_type: z.enum(['Kid Program', 'Adult Music', 'Conference', 'Sport']),

  image_url: z.string().optional().or(z.literal('')),
});

type EventFormValues = z.infer<typeof eventSchema>;

// ================= COMPONENT =================
const EventForm: React.FC = () => {
  const navigate = useNavigate();

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
      latitude: 9.03,
      longitude: 38.74,
      event_type: 'Adult Music',
      total_tickets: 100,
      ticket_price: 0,
    },
  });

  const lat = watch('latitude');
  const lng = watch('longitude');

  // ================= FILE HANDLING =================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ================= SUBMIT =================
  const onSubmit = async (data: EventFormValues) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // TEMP USER (since Supabase removed)
      const user = { id: 'local-user' };

      let finalImageUrl = data.image_url;

      // Upload image (mock or backend later)
      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
      }

      await createEvent({
        title: data.title,
        description: data.description,

        event_date: new Date(data.date).toISOString(),
        date: new Date(data.date).toISOString(),

        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,

        ticket_price: data.ticket_price,
        price: data.ticket_price,

        total_tickets: data.total_tickets,
        selling_deadline: new Date(data.selling_deadline).toISOString(),

        event_type: data.event_type,
        image_url: finalImageUrl || '',

        organizer_id: user.id,
      });

      toast.success('Event created successfully!');

      setTimeout(() => {
        navigate('/admin/dashboard?tab=events');
      }, 1000);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= LOCATION =================
  const handleLocationChange = (newLat: number, newLng: number) => {
    setValue('latitude', newLat);
    setValue('longitude', newLng);
  };

  // ================= UI =================
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-20">

      {/* FORM CONTENT (UNCHANGED UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          {/* EVENT DETAILS */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-black">Event Details</h3>
            </div>

            <input
              {...register('title')}
              placeholder="Event Title"
              className="w-full p-4 bg-gray-50 rounded-2xl"
            />
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}

            <textarea
              {...register('description')}
              placeholder="Description"
              className="w-full p-4 bg-gray-50 rounded-2xl"
            />
          </div>

          {/* PRICE & TIME */}
          <div className="bg-white p-8 rounded-[2.5rem] border space-y-4">

            <input
              type="datetime-local"
              {...register('date')}
              className="w-full p-4 bg-gray-50 rounded-2xl"
            />

            <input
              type="number"
              {...register('ticket_price', { valueAsNumber: true })}
              placeholder="Ticket Price"
              className="w-full p-4 bg-gray-50 rounded-2xl"
            />

            <input
              type="number"
              {...register('total_tickets', { valueAsNumber: true })}
              placeholder="Total Tickets"
              className="w-full p-4 bg-gray-50 rounded-2xl"
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">

          {/* LOCATION */}
          <div className="bg-white p-8 rounded-[2.5rem] border">
            <input
              {...register('location')}
              placeholder="Location"
              className="w-full p-4 bg-gray-50 rounded-2xl"
            />

            <LocationPicker lat={lat} lng={lng} onChange={handleLocationChange} />
          </div>

          {/* IMAGE */}
          <div className="bg-white p-8 rounded-[2.5rem] border">

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 bg-gray-100 rounded-2xl"
              >
                Upload Image
              </button>
            ) : (
              <div className="relative">
                <img src={previewUrl} className="rounded-2xl" />
                <button type="button" onClick={removeFile}>
                  <X />
                </button>
              </div>
            )}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-bold"
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EventForm;