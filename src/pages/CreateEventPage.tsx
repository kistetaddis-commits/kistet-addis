import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  MapPin,
  Calendar as CalendarIcon,
  Ticket,
  Tag,
  ChevronLeft,
  Loader2,
  Save,
  Clock,
  DollarSign,
  Lock,
  ArrowRight,
  Upload
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { toast } from 'sonner';

import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage, FormDescription
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { cn } from '../lib/utils';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// Leaflet fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ================= SCHEMA (FIXED) =================
const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),

  event_date: z.date(),

  location: z.string().min(1),

  latitude: z.number(),
  longitude: z.number(),

  total_tickets: z.number().min(1),
  ticket_price: z.number().min(0),

  selling_deadline: z.date(),

  event_type: z.enum(['Kid Program', 'Adult Music', 'Conference', 'Sport']),
}).refine(data => data.selling_deadline < data.event_date, {
  message: "Selling deadline must be before event date",
  path: ["selling_deadline"]
});

// ================= MAP MARKER =================
function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

// ================= COMPONENT =================
const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number]>([9.03, 38.74]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      latitude: 9.03,
      longitude: 38.74,
      total_tickets: 100,
      ticket_price: 0,
      event_type: 'Conference',
    },
  });

  // ================= IMAGE =================
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ================= SUBMIT =================
  async function handleOnSubmit(values: any) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let imageUrl =
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1200';

      if (imageFile) {
        const uploadRes = await api.uploadImage(imageFile);
        imageUrl = uploadRes.url;
      }

      await api.createEvent({
        title: values.title,
        description: values.description,

        // IMPORTANT FIX
        event_date: values.event_date.toISOString(),

        location: values.location,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),

        price: Number(values.ticket_price),
        total_tickets: Number(values.total_tickets),

        selling_deadline: values.selling_deadline.toISOString(),
        event_type: values.event_type,

        image_url: imageUrl,
      });

      toast.success('Event created successfully!');
      navigate('/admin/dashboard');

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ================= LOADING =================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  // ================= ACCESS CHECK =================
  if (!user || (user.role !== 'admin' && user.role !== 'organizer')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Lock className="w-12 h-12" />
        <h2>Access Denied</h2>
        <Button onClick={() => navigate('/login')}>
          Login <ArrowRight />
        </Button>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="p-6 max-w-5xl mx-auto">

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft />
        </Button>
        <h1 className="text-2xl font-bold">Create Event</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleOnSubmit)} className="space-y-6">

          {/* TITLE */}
          <FormField control={form.control} name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* DESCRIPTION */}
          <FormField control={form.control} name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* IMAGE */}
          <div>
            <label>Event Image</label>
            <input type="file" onChange={handleImageChange} />
            {imagePreview && <img src={imagePreview} className="w-40 mt-2" />}
          </div>

          {/* PRICE + TICKETS */}
          <div className="grid grid-cols-2 gap-4">

            <FormField control={form.control} name="ticket_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField control={form.control} name="total_tickets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Tickets</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* SUBMIT */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
            Create Event
          </Button>

        </form>
      </Form>
    </div>
  );
};

export default CreateEventPage;