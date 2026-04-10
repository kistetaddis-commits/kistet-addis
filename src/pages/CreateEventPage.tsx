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

// Fix for Leaflet marker icon issues
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.date().refine(date => date > new Date(), 'Event date must be in the future'),
  location: z.string().min(1, 'Location name is required'),
  latitude: z.number(),
  longitude: z.number(),
  total_tickets: z.number().min(1, 'Total tickets must be at least 1'),
  price: z.number().min(0, 'Ticket price must be at least 0'),
  selling_deadline: z.date(),
  event_type: z.enum(['Kid Program', 'Adult Music', 'Conference', 'Sport']),
}).refine(data => data.selling_deadline < data.date, {
  message: "Selling deadline must be before the event date",
  path: ["selling_deadline"]
});

type EventFormValues = z.infer<typeof eventSchema>;

function LocationMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number]; 
  setPosition: (pos: [number, number]) => void 
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
    },
  });

  return position ? (
    <Marker position={position} />
  ) : null;
}

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number]>([9.03, 38.74]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      location: '',
      latitude: 9.03,
      longitude: 38.74,
      total_tickets: 100,
      price: 0,
      event_type: 'Conference',
    },
  });

  const onLocationSelected = useCallback(async (pos: [number, number]) => {
    setMapPosition(pos);
    form.setValue('latitude', pos[0]);
    form.setValue('longitude', pos[1]);
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`);
      const data = await response.json();
      if (data && data.display_name) {
        form.setValue('location', data.display_name);
      }
    } catch (error) {
      console.warn('Reverse geocoding error:', error);
    }
  }, [form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleOnSubmit(values: EventFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      let imageUrl = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1200';
      
      if (imageFile) {
        const uploadRes = await api.uploadImage(imageFile);
        imageUrl = uploadRes.url;
      }

      await api.createEvent({
        title: values.title,
        description: values.description,
        date: values.date.toISOString(),
        location: values.location,
        latitude: values.latitude,
        longitude: values.longitude,
        price: values.price,
        total_tickets: values.total_tickets,
        selling_deadline: values.selling_deadline.toISOString(),
        event_type: values.event_type,
        image_url: imageUrl
      });

      toast.success('Event created successfully!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('CreateEventPage: Error creating event:', error);
      toast.error(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold">Verifying session...</p>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'organizer')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mx-auto mb-6">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Restricted Access</h2>
          <p className="text-gray-500 mb-8 font-medium">This page is restricted to administrators and organizers.</p>
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-black text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
            onClick={() => navigate('/login', { state: { from: '/admin/events/create' } })}
          >
            Go to Login <ArrowRight className="w-5 h-5" />
          </Button>
          <Link to="/" className="inline-block mt-6 text-sm font-bold text-gray-400 hover:text-gray-600">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="icon" 
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full bg-white shadow-sm border border-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Create New Event</h1>
            <p className="text-gray-500 font-medium">Publish a new event to the Kistet Addis platform</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 lg:p-12">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleOnSubmit)} className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Tag className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-black text-gray-800">Basic Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-black text-gray-700">Event Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a catchy title" className="rounded-xl py-6 bg-gray-50 border-gray-100 font-bold" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="event_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-black text-gray-700">Event Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl py-6 bg-gray-50 border-gray-100 font-bold">
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="Kid Program">Kid Program</SelectItem>
                              <SelectItem value="Adult Music">Adult Music</SelectItem>
                              <SelectItem value="Conference">Conference</SelectItem>
                              <SelectItem value="Sport">Sport</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-black text-gray-700">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell people what this event is about..." 
                            className="rounded-xl bg-gray-50 border-gray-100 font-medium min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel className="text-sm font-black text-gray-700">Event Image</FormLabel>
                    <div className="flex items-center gap-6">
                      <div className="relative w-40 h-40 bg-gray-100 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-300" />
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleImageChange}
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        <p className="font-bold">Click to upload event banner</p>
                        <p>Recommended: 1200x600px</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <CalendarIcon className="w-5 h-5 text-purple-600" />
                    <h2 className="text-xl font-black text-gray-800">Date & Deadlines</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-black text-gray-700">Event Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-bold rounded-xl py-6 bg-gray-50 border-gray-100",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="selling_deadline"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-black text-gray-700">Selling Deadline</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-bold rounded-xl py-6 bg-gray-50 border-gray-100",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a deadline</span>
                                  )}
                                  <Clock className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <h2 className="text-xl font-black text-gray-800">Location Selection</h2>
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-black text-gray-700">Location Name / Address</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Millennium Hall, Addis Ababa" className="rounded-xl py-6 bg-gray-50 border-gray-100 font-bold" {...field} />
                        </FormControl>
                        <FormDescription>Type the name of the venue or select on the map below to auto-fill.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormLabel className="text-sm font-black text-gray-700">Pick Location on Map</FormLabel>
                    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner z-0">
                      <MapContainer 
                        center={mapPosition} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker position={mapPosition} setPosition={onLocationSelected} />
                      </MapContainer>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h2 className="text-xl font-black text-gray-800">Pricing & Capacity</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-black text-gray-700">Ticket Price (ETB)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input 
                                type="number" 
                                className="pl-12 rounded-xl py-6 bg-gray-50 border-gray-100 font-bold" 
                                {...field}
                                value={field.value as number}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_tickets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-black text-gray-700">Total Tickets Available</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input 
                                type="number" 
                                className="pl-12 rounded-xl py-6 bg-gray-50 border-gray-100 font-bold" 
                                {...field}
                                value={field.value as number}
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-10 flex gap-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 rounded-2xl py-8 font-black text-lg border-gray-200"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-8 font-black text-lg shadow-xl shadow-blue-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Creating...</>
                    ) : (
                      <><Save className="mr-2 h-6 w-6" /> Create Event</>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEventPage;