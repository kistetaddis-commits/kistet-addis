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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
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

// ✅ VALIDATION
const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.date(),
  selling_deadline: z.date(),
  location: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  total_tickets: z.number().min(1),
  ticket_price: z.number().min(0),
  event_type: z.enum(['Kid Program', 'Adult Music', 'Conference', 'Sport']),
}).refine(data => data.selling_deadline < data.date, {
  message: "Deadline must be before event date",
  path: ["selling_deadline"]
});

type EventFormValues = z.infer<typeof eventSchema>;

// Map marker
function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} />;
}

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number]>([9.03, 38.74]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
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

  // Map click
  const onLocationSelected = useCallback((pos: [number, number]) => {
    setMapPosition(pos);
    form.setValue('latitude', pos[0]);
    form.setValue('longitude', pos[1]);
  }, [form]);

  // Image upload preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ✅ SUBMIT (FIXED)
  async function handleOnSubmit(values: EventFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!values.date || !values.selling_deadline) {
        throw new Error("Select dates");
      }

      if (isNaN(values.ticket_price)) {
        throw new Error("Invalid ticket price");
      }

      if (isNaN(values.total_tickets)) {
        throw new Error("Invalid ticket count");
      }

      let imageUrl = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4";

      if (imageFile) {
        const res = await api.uploadImage(imageFile);
        imageUrl = res.url;
      }

      const payload = {
        title: values.title,
        description: values.description,
        date: values.date.toISOString(),
        selling_deadline: values.selling_deadline.toISOString(),
        location: values.location,
        latitude: values.latitude,
        longitude: values.longitude,
        ticket_price: values.ticket_price,
        total_tickets: values.total_tickets,
        event_type: values.event_type,
        image_url: imageUrl,
      };

      console.log("🚀 EVENT:", payload);

      await api.createEvent(payload);

      toast.success("Event created!");
      navigate('/admin/dashboard');

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Internal server error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="p-10">Loading...</div>;

  if (!user) return <div className="p-10">Unauthorized</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleOnSubmit)} className="space-y-6">

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <Input placeholder="Title" {...field} />
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <Textarea placeholder="Description" {...field} />
            )}
          />

          <input type="file" onChange={handleImageChange} />

          <FormField
            control={form.control}
            name="ticket_price"
            render={({ field }) => (
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />

          <FormField
            control={form.control}
            name="total_tickets"
            render={({ field }) => (
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>

        </form>
      </Form>
    </div>
  );
};

export default CreateEventPage;