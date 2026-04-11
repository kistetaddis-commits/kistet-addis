import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { createEvent, uploadImage } from '../../lib/api';
import LocationPicker from '../maps/LocationPicker';
import { X } from 'lucide-react';

// ================= VALIDATION =================
const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),

  date: z.string().min(1),

  location: z.string().min(3),
  latitude: z.number(),
  longitude: z.number(),

  total_tickets: z.number().min(1),
  ticket_price: z.number().min(0),

  selling_deadline: z.string().min(1),

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

  // ================= FILE =================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ================= SUBMIT =================
  const onSubmit = async (data: EventFormValues) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let imageUrl = '';

      // upload image
      if (selectedFile) {
        const res = await uploadImage(selectedFile);

        // IMPORTANT FIX: backend returns { url }
        imageUrl = res.url;
      }

      await createEvent({
        title: data.title,
        description: data.description,

        // ✅ FIXED: backend expects event_date ONLY
        event_date: new Date(data.date).toISOString(),

        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,

        price: data.ticket_price,
        total_tickets: data.total_tickets,

        event_type: data.event_type,

        selling_deadline: new Date(data.selling_deadline).toISOString(),

        image_url: imageUrl,
      });

      toast.success('Event created successfully!');
      navigate('/admin/dashboard?tab=events');

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= UI =================
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <input {...register('title')} placeholder="Title" />
      {errors.title && <p>{errors.title.message}</p>}

      <textarea {...register('description')} placeholder="Description" />

      <input type="datetime-local" {...register('date')} />

      <input type="number" {...register('ticket_price', { valueAsNumber: true })} />
      <input type="number" {...register('total_tickets', { valueAsNumber: true })} />

      <input {...register('location')} placeholder="Location" />

      <LocationPicker
        lat={lat}
        lng={lng}
        onChange={(a, b) => {
          setValue('latitude', a);
          setValue('longitude', b);
        }}
      />

      {/* IMAGE */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        hidden
      />

      {!previewUrl ? (
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Upload Image
        </button>
      ) : (
        <div>
          <img src={previewUrl} alt="preview" />
          <button type="button" onClick={removeFile}>
            <X />
          </button>
        </div>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Event'}
      </button>

    </form>
  );
};

export default EventForm;