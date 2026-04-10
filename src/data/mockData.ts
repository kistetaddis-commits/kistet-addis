import { Event, Ticket, User, Payment } from '../types';

export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Addis Music Festival 2024',
    description: 'The biggest music event in the heart of Addis Ababa featuring top local and international artists.',
    date: '2024-12-15T18:00:00Z',
    location: 'Millennium Hall, Addis Ababa',
    price: 500,
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80',
    latitude: 9.02497,
    longitude: 38.74689,
    total_tickets: 5000,
    selling_deadline: '2024-12-14T23:59:59Z',
    event_type: 'Adult Music',
    organizer_id: 'org1'
  },
  {
    id: '2',
    title: 'Ethio Tech Summit',
    description: 'Join industry leaders and innovators for a two-day summit exploring the future of technology in Ethiopia.',
    date: '2024-11-20T09:00:00Z',
    location: 'Skylight Hotel, Addis Ababa',
    price: 1200,
    image_url: 'https://images.unsplash.com/photo-1540575861501-7ad0582373f1?auto=format&fit=crop&q=80',
    latitude: 9.0105,
    longitude: 38.7615,
    total_tickets: 1000,
    selling_deadline: '2024-11-19T23:59:59Z',
    event_type: 'Conference',
    organizer_id: 'org1'
  },
  {
    id: '3',
    title: 'Great Ethiopian Run',
    description: 'Participate in the legendary Great Ethiopian Run, a celebration of fitness and culture.',
    date: '2024-11-17T06:00:00Z',
    location: 'Meskel Square, Addis Ababa',
    price: 300,
    image_url: 'https://images.unsplash.com/photo-1530549387631-6c129c1abc7a?auto=format&fit=crop&q=80',
    latitude: 9.0105,
    longitude: 38.7615,
    total_tickets: 30000,
    selling_deadline: '2024-11-16T23:59:59Z',
    event_type: 'Sport',
    organizer_id: 'org1'
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    user_id: 'u1',
    event_id: '1',
    user_name: 'Abebe Bikila',
    phone: '+251911223344',
    quantity: 2,
    status: 'active',
    qr_code: 'KISTET-T1-APPROVED',
    created_at: '2024-10-01'
  },
  {
    id: 't2',
    user_id: 'u2',
    event_id: '1',
    user_name: 'Almaz Ayana',
    phone: '+251922334455',
    quantity: 1,
    status: 'pending',
    qr_code: 'KISTET-T2-PENDING',
    created_at: '2024-10-02'
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'p1',
    ticket_id: 't1',
    user_id: 'u1',
    event_id: '1',
    amount: 1000,
    method: 'telebirr',
    transaction_id: 'TX123456',
    status: 'approved',
    created_at: '2024-10-01T10:00:00Z'
  },
  {
    id: 'p2',
    ticket_id: 't2',
    user_id: 'u2',
    event_id: '1',
    amount: 500,
    method: 'cbe',
    transaction_id: 'TX789012',
    status: 'pending',
    created_at: '2024-10-02T11:00:00Z'
  }
];

export const MOCK_USERS: User[] = [
  {
    id: 'admin1',
    name: 'KistetAddis',
    role: 'admin'
  },
  {
    id: 'org1',
    name: 'organizer_one',
    role: 'organizer'
  }
];