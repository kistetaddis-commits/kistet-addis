import { Event } from '../types';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Addis Music Fest 2024',
    description: 'A vibrant concert featuring top Ethiopian artists at Meskel Square.',
    event_date: '2024-05-20',
    location: 'Meskel Square, Addis Ababa',
    ticket_price: 500,
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80',
    latitude: 9.02497,
    longitude: 38.74689,
    total_tickets: 5000,
    sold_tickets: 1200,
    selling_deadline: '2024-05-19T23:59:59Z',
    event_type: 'Concerts',
    organizer_id: 'admin1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Ethio Tech Summit',
    description: 'Discover the latest innovations in the Ethiopian tech ecosystem.',
    event_date: '2024-06-12',
    location: 'Millennium Hall, Addis Ababa',
    ticket_price: 300,
    image_url: 'https://images.unsplash.com/photo-1540575861501-7ad0582373f1?auto=format&fit=crop&q=80',
    latitude: 9.0105,
    longitude: 38.7615,
    total_tickets: 1000,
    sold_tickets: 300,
    selling_deadline: '2024-06-11T23:59:59Z',
    event_type: 'Conferences',
    organizer_id: 'admin1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Habesha Cultural Night',
    description: 'Experience the richness of Ethiopian culture through music, dance, and food.',
    event_date: '2024-05-25',
    location: 'Skylight Hotel, Addis Ababa',
    ticket_price: 800,
    image_url: 'https://images.unsplash.com/photo-1530549387631-6c129c1abc7a?auto=format&fit=crop&q=80',
    latitude: 9.0105,
    longitude: 38.7615,
    total_tickets: 2000,
    sold_tickets: 850,
    selling_deadline: '2024-05-24T23:59:59Z',
    event_type: 'Cultural',
    organizer_id: 'admin1',
    created_at: '2024-01-01T00:00:00Z'
  }
];